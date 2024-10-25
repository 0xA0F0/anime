new Vue({
	el: '#main',
	data: {
		inputUserId: '',
		userId: '',
		user: {},
		userLoaded: false,
		isGuest: false,
		userAnimeList: [],
		filteredAnimeList: [],
		showAnimeList: false,
		currentStatus: '',
		statuses: ['', 'watching', 'planned', 'completed', 'on_hold', 'dropped'],
		statusIcons: {
			'': 'list',
			'watching': 'play_circle',
			'planned': 'today',
			'completed': 'check',
			'on_hold': 'inbox',
			'dropped': 'delete'
		},
		releaseStatusIcons: {
			'ongoing': 'play_circle',
			'released': 'check'
		},
		searchQuery: '',
		searchResults: [],
		randomText: 'l8zp99yydgjatfs6glm3x1i3j3oujnr0',
		debouncedSearchAnime: null,
	},
	methods: {
		loginAsGuest() {
			this.isGuest = true;
			this.userLoaded = true;
		},
		async fetchUserInfo() {
			if (this.inputUserId.trim() !== '') {
				this.userId = this.inputUserId.trim();

				const url = `https://shikimori.one/api/users/${this.userId}/anime_rates?limit=5000`;
				try {
					const response = await fetch(url, {
						method: 'GET',
						headers: {
							'Content-Type': 'application/json',
						},
					});
					const data = await response.json();
					if (Array.isArray(data) && data.length > 0) {
						this.userAnimeList = data;

						const userData = data[0].user;
						if (userData && userData.nickname) {
							this.user = {
								nickname: userData.nickname,
								avatarUrl: userData.image.x160
							};
							this.userLoaded = true;
							this.isGuest = false;

							this.inputUserId = '';
						} else {
							alert('Не удалось получить информацию о пользователе.');
						}
					} else {
						alert('Ошибка, или пользователь скрыл свой список.');
					}
				} catch (error) {
					console.error('Ошибка при выполнении запроса:', error);
				}
			}
		},
		fetchUserAnimeList(status) {
			this.currentStatus = status;
			if (status === '') {
				this.filteredAnimeList = this.userAnimeList.filter(rate => rate.anime);
			} else {
				this.filteredAnimeList = this.userAnimeList.filter(rate => rate.status === status && rate.anime);
			}
			console.log(`Аниме со статусом ${status}:`, this.filteredAnimeList);
			if (this.filteredAnimeList.length === 0) {
				alert(`Нет аниме с выбранным статусом.`);
			}
			this.showAnimeList = true;
		},
		closeAnimeList() {
			this.showAnimeList = false;
		},

		async searchAnime() {
			if (this.searchQuery.trim() !== '') {
				const query = `
                {
                    animes(search: "${this.searchQuery}", limit: 25) {
                        id
                        russian
                        status
                        poster {
                            id
                            originalUrl
                            mainUrl
                        }
                    }
                }
                `;
				try {
					const response = await fetch('https://shikimori.one/api/graphql', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							query
						})
					});
					const data = await response.json();
					if (data && data.data && data.data.animes) {
						const animesWithKodik = await Promise.all(
							data.data.animes.map(async (anime) => {
								const kodikUrl = `https://kodikapi.com/search?token=${this.randomText}&shikimori_id=${anime.id}`;
								try {
									const kodikResponse = await fetch(kodikUrl);
									const kodikData = await kodikResponse.json();
									if (kodikData.results && kodikData.results.length > 0) {
										return anime;
									} else {
										return null;
									}
								} catch (error) {
									console.error('Ошибка при обращении к Kodik API:', error);
									return null;
								}
							})
						);
						this.searchResults = animesWithKodik.filter(anime => anime !== null);
					} else {
						console.error('Не удалось получить результаты поиска.');
					}
				} catch (error) {
					console.error('Ошибка при выполнении запроса:', error);
				}
			} else {
				this.searchResults = [];
			}
		},

		selectAnime(animeId) {
			window.location.hash = `#id=${animeId}`;
			this.showKodikPlayer(animeId);
		},
		async showKodikPlayer(animeId) {
			if (!this.userLoaded) {
				this.loginAsGuest();
			}

			const kodikUrl = `https://kodikapi.com/search?token=${this.randomText}&shikimori_id=${animeId}`;
			try {
				const response = await fetch(kodikUrl);
				const data = await response.json();
				if (data.results && data.results.length > 0) {
					const playerLink = data.results[0].link;
					this.openPlayerModal(playerLink);
				} else {
					alert('Этого аниме нет в базе данных.');
				}
			} catch (error) {
				console.error('Ошибка при получении плеера Kodik:', error);
			}
		},
		openPlayerModal(playerLink) {
			const existingModal = document.getElementById('kodik-player-modal');
			if (existingModal) {
				existingModal.remove();
			}

			const modal = document.createElement('div');
			modal.id = 'kodik-player-modal';

			const iframe = document.createElement('iframe');
			iframe.src = playerLink.startsWith('http') ? playerLink : `https:${playerLink}`;
			iframe.allowFullscreen = true;


			const closeButton = document.createElement('span');
			closeButton.textContent = 'close';
			closeButton.classList.add('close-button', 'material-symbols-outlined');

			closeButton.addEventListener('click', () => {
				document.body.removeChild(modal);
				window.location.hash = '';
			});

			modal.appendChild(iframe);
			modal.appendChild(closeButton);
			document.body.appendChild(modal);

			modal.addEventListener('click', (event) => {
				if (event.target === modal) {
					modal.remove();
					window.location.hash = '';
				}
			});
		},
		handleHashChange() {
			const hash = window.location.hash;
			if (hash.startsWith('#id=')) {
				const animeId = hash.substring(4);

				if (!this.userLoaded) {
					this.loginAsGuest();
				}

				this.showKodikPlayer(animeId);
			}
		},
		debounce(func, wait) {
			let timeout;
			return function(...args) {
				const later = () => {
					clearTimeout(timeout);
					func.apply(this, args);
				};
				clearTimeout(timeout);
				timeout = setTimeout(later, wait);
			};
		},
	},
	watch: {
		searchQuery() {
			this.debouncedSearchAnime();
		}
	},
	created() {
		window.addEventListener('hashchange', this.handleHashChange);
		this.handleHashChange();
		this.debouncedSearchAnime = this.debounce(this.searchAnime, 500);
	},
	beforeDestroy() {
		window.removeEventListener('hashchange', this.handleHashChange);
	}
});
