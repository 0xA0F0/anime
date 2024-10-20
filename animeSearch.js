// animeSearch.js

export default {
    data() {
        return {
            searchQuery: '',       
            animes: [],             
            userAnimes: {},          
            user: null,              
            debouncedSearch: null,  
            message: '',             
            messageClass: '',        
            isLoading: false,
            statusIcons: {
                'watching': 'play_circle',
                'planne∂d': 'today',
                'completed': 'check',
                'on_hold': 'inbox',
                'dropped': 'delete',
            },
            statusOptions: ['watching', 'planned', 'completed', 'on_hold', 'dropped'],
            route: window.location.hash,
            encryptedApiToken: 'U2FsdGVkX18w60vvAAx70GP780r9LPsl5MyT1TQdzL8z7O8qAzOdk8XYvNAjJFy7NGnxaKL1PcT26zniOhn1og==', 
            secretKey: 'g(&^G73g7243gf7g^&(&D^7g9763467f23467gf76234fg67g^&^GYUBHB@TIttwdfytef5^F%t', 
            decryptedApiToken: '',
        };
    },
    computed: {
        watchingCount() {
            return this.countStatus('watching');
        },
        plannedCount() {
            return this.countStatus('planned');
        },
        completedCount() {
            return this.countStatus('completed');
        },
        onHoldCount() {
            return this.countStatus('on_hold');
        },
        droppedCount() {
            return this.countStatus('dropped');
        },
        totalAnimes() {
            return Object.keys(this.userAnimes).length;
        },
        isAuthRoute() {
            return this.route === '#login' || this.route === '#reg';
        }
    },
    methods: {
        countStatus(status) {
            return Object.values(this.userAnimes).filter(s => s === status).length;
        },

        decryptApiToken() {
            try {
                const bytes = CryptoJS.AES.decrypt(this.encryptedApiToken, this.secretKey);
                const originalToken = bytes.toString(CryptoJS.enc.Utf8);
                if (!originalToken) {
                    throw new Error('Не удалось расшифровать API-ключ.');
                }
                this.decryptedApiToken = originalToken;
            } catch (error) {
                console.error('Ошибка при расшифровке API-ключа:', error);
                this.showMessage('Ошибка при инициализации API-ключа.', 'error');
            }
        },

        async loadUserAnimes() {
            if (!this.user) return;

            const database = firebase.database();
            const userAnimesRef = database.ref('users/' + this.user.uid + '/animes');

            try {
                const snapshot = await userAnimesRef.once('value');
                const userAnimesData = snapshot.val() || [];

                console.log("Аниме пользователя:", userAnimesData);

                this.userAnimes = {};
                userAnimesData.forEach(anime => {
                    this.userAnimes[String(anime.id)] = anime.status;
                });
            } catch (error) {
                console.error("Ошибка при загрузке аниме пользователя:", error);
                this.showMessage("Ошибка при загрузке аниме пользователя.", "error");
            }
        },

        handleHashChange() {
            this.route = window.location.hash;
            if (this.route.startsWith('#id=')) {
                const animeId = this.route.replace('#id=', '');
                this.showKodikPlayer(animeId);
            }
        },

        async searchAnime() {
            const searchQuery = this.searchQuery.trim();

            this.isLoading = true;
            console.log("Начало поиска. isLoading:", this.isLoading);

            try {
                if (searchQuery === "") {
                    this.animes = [];
                    console.log("Пустой запрос. animes:", this.animes);
                    return;
                }

                const query = `
                {
                    animes(search: "${searchQuery}", limit: 25) {
                        id
                        name
                        russian
                        poster {
                            previewUrl
                        }
                        status
                    }
                }`;

                const response = await fetch("https://shikimori.one/api/graphql", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({ query })
                });

                if (response.status === 429) {
                    throw new Error("Слишком много запросов. Пожалуйста, попробуйте позже.");
                }

                const data = await response.json();

                if (data.data && data.data.animes) {
                    const animesWithKodik = await Promise.all(
                        data.data.animes.map(async (anime) => {
                            const kodikUrl = `https://kodikapi.com/search?token=${this.decryptedApiToken}&types=anime-serial,anime&shikimori_id=${anime.id}`;

                            try {
                                const kodikResponse = await fetch(kodikUrl);

                                if (kodikResponse.status === 429) {
                                    throw new Error("Слишком много запросов к Kodik API. Пожалуйста, попробуйте позже.");
                                }

                                const kodikData = await kodikResponse.json();

                                if (kodikData.results && kodikData.results.length > 0) {
                                    const userAnimeStatus = this.userAnimes[String(anime.id)] || null;
                                    return {
                                        ...anime,
                                        userStatus: userAnimeStatus,
                                    };
                                } else {
                                    return null;
                                }
                            } catch (error) {
                                console.error("Ошибка при проверке аниме в Kodik:", error);
                                return null;
                            }
                        })
                    );

                    this.animes = animesWithKodik.filter((anime) => anime !== null);
                    console.log("Результаты поиска:", this.animes);
                } else {
                    this.animes = [];
                    console.log("Нет результатов поиска. animes:", this.animes);
                }
            } catch (error) {
                console.error("Ошибка при поиске аниме:", error);
                this.showMessage(error.message, "error");
                this.animes = [];
            } finally {
                this.isLoading = false;
                console.log("Завершение поиска. isLoading:", this.isLoading);
            }
        },

        async fetchAnimesByIds(animeIds, batchSize = 10, maxRetries = 3) {
            const results = [];
            let index = 0;

            while (index < animeIds.length) {
                const batch = animeIds.slice(index, index + batchSize);
                const batchPromises = batch.map(id => this.fetchAnimeDetail(id, maxRetries));
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults.filter(anime => anime !== null));
                index += batchSize;
                await this.delay(1000); 
            }

            return results;
        },

        async fetchAnimeDetail(animeId, maxRetries) {
            const query = `
            {
                anime(id: ${animeId}) {
                    id
                    name
                    russian
                    poster {
                        previewUrl
                    }
                    status
                }
            }`;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const response = await fetch("https://shikimori.one/api/graphql", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },
                        body: JSON.stringify({ query })
                    });

                    if (response.status === 429) {
                        const retryAfter = response.headers.get('Retry-After') || 2;
                        console.warn(`Получен статус 429. Повторная попытка через ${retryAfter} секунд (Попытка ${attempt} из ${maxRetries})`);
                        await this.delay(retryAfter * 1000);
                        continue;
                    }

                    const data = await response.json();

                    if (data.data && data.data.anime) {
                        const userAnimeStatus = this.userAnimes[String(animeId)] || null;
                        return {
                            ...data.data.anime,
                            userStatus: userAnimeStatus,
                        };
                    } else {
                        return null;
                    }
                } catch (error) {
                    if (attempt === maxRetries) {
                        console.error(`Ошибка при загрузке аниме с ID ${animeId}:`, error);
                        this.showMessage(`Ошибка при загрузке аниме с ID ${animeId}.`, "error");
                        return null;
                    }
                    console.warn(`Ошибка при загрузке аниме с ID ${animeId}. Повторная попытка (${attempt}/${maxRetries})...`);
                    await this.delay(1000 * attempt);
                }
            }

            return null;
        },

        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        getStatusIcon(status) {
            return this.statusIcons[status] || '';
        },
        
        async selectAnime(animeId) {
            window.location.hash = '#id=' + animeId;
        },

        async showKodikPlayer(animeId) {
            if (document.getElementById('kodik-player-modal')) {
                document.getElementById('kodik-player-modal').remove();
            }

            const kodikUrl = `https://kodikapi.com/search?token=${this.decryptedApiToken}&types=anime-serial,anime&shikimori_id=${animeId}`;

            try {
                const response = await fetch(kodikUrl);

                if (response.status === 429) {
                    throw new Error("Слишком много запросов к Kodik API. Пожалуйста, попробуйте позже.");
                }

                const data = await response.json();

                if (data.results.length === 0) {
                    throw new Error('Аниме не найдено в базе данных Kodik.');
                }

                const kodikAnime = data.results[0];

                if (!kodikAnime.link) {
                    throw new Error('Ошибка: ссылка на плеер не найдена.');
                }

                const currentStatus = this.userAnimes[String(animeId)] || null;

                const modal = document.createElement('div');
                modal.id = 'kodik-player-modal';
                modal.style.position = 'fixed';
                modal.style.top = '0';
                modal.style.left = '0';
                modal.style.width = '100%';
                modal.style.height = '100%';
                modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                modal.style.display = 'flex';
                modal.style.flexDirection = 'column';
                modal.style.justifyContent = 'center';
                modal.style.alignItems = 'center';
                modal.style.zIndex = '1000';

                if (this.user) {
                    const statusContainer = document.createElement('div');
                    statusContainer.classList.add('status-container');
                    this.statusOptions.forEach((status) => {
                        const button = document.createElement('button');
                        button.classList.add('status-button');

                        if (currentStatus === status) {
                            button.classList.add('on');
                        }

                        if (this.statusIcons[status]) {
                            const icon = document.createElement("span");
                            icon.classList.add("material-symbols-outlined");
                            icon.innerText = this.statusIcons[status];
                            button.appendChild(icon);
                        }

                        button.addEventListener('click', () => {
                            this.setAnimeStatus(animeId, status);
                            Array.from(statusContainer.children).forEach((btn) => {
                                btn.classList.remove('on');
                            });
                            button.classList.add('on');
                        });

                        statusContainer.appendChild(button);
                    });

                    modal.appendChild(statusContainer);
                }

                const iframe = document.createElement('iframe');
                iframe.src = kodikAnime.link.startsWith('http') ? kodikAnime.link : `https:${kodikAnime.link}`;
                iframe.style.height = '80%';
                iframe.style.width = '80%';
                iframe.style.maxWidth = '1000px';
                iframe.style.maxHeight = '600px';
                iframe.style.border = 'none';                

                const closeButton = document.createElement('span');
                closeButton.classList.add("material-symbols-outlined", "close");
                closeButton.innerText = 'close';
                closeButton.style.position = 'absolute';
                closeButton.style.top = '10px';
                closeButton.style.right = '10px';
                closeButton.style.cursor = 'pointer';
                closeButton.style.setProperty('font-size', '24px', 'important');

                closeButton.onclick = () => {
                    modal.remove();
                    window.location.hash = '';
                };

                modal.appendChild(closeButton);
                document.body.appendChild(modal);

                modal.addEventListener('click', (event) => {
                    if (event.target === modal) {
                        modal.remove();
                        window.location.hash = ''; 
                    }
                });

                modal.appendChild(iframe);
                modal.appendChild(closeButton);
                document.body.appendChild(modal);
            } catch (error) {
                console.error("Ошибка при получении плеера:", error);
                this.showMessage(error.message, "error");
                window.location.hash = '';
            }
        },

        async setAnimeStatus(animeId, status) {
            if (!this.user) {
                this.showMessage("Пользователь не авторизован. Войдите в систему для добавления аниме.", "error");
                return;
            }

            const database = firebase.database();
            const userAnimesRef = database.ref('users/' + this.user.uid + '/animes');

            try {
                const snapshot = await userAnimesRef.once('value');
                const userAnimesData = snapshot.val() || [];

                const animeIndex = userAnimesData.findIndex(anime => String(anime.id) === String(animeId));

                if (animeIndex !== -1) {
                    userAnimesData[animeIndex].status = status;
                } else {
                    const newAnime = {
                        id: String(animeId),
                        status: status
                    };
                    userAnimesData.push(newAnime);
                }

                await userAnimesRef.set(userAnimesData);
                await this.loadUserAnimes();

                this.showMessage("Статус аниме успешно обновлен.", "success");
            } catch (error) {
                console.error("Ошибка при обновлении статуса аниме:", error);
                this.showMessage("Произошла ошибка при обновлении статуса аниме.", "error");
            }
        },

        showMessage(text, type) {
            this.message = text;
            this.messageClass = type;

            setTimeout(() => {
                this.message = '';
                this.messageClass = '';
            }, 5000);
        },

        debounce(func, wait) {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        },
    },
    created() {
        this.debouncedSearch = this.debounce(this.searchAnime, 300);
        
        this.decryptApiToken();

        firebase.auth().onAuthStateChanged(async (user) => {
            this.user = user;
            if (user) {
                await this.loadUserAnimes();
                this.handleHashChange();
            } else {
                this.userAnimes = {};
            }
        });

        window.addEventListener('hashchange', this.handleHashChange.bind(this));
    },
    beforeUnmount() {
        window.removeEventListener('hashchange', this.handleHashChange.bind(this));
    }
};
