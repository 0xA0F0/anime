// main.js

import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import auth from './auth.js';
import animeSearch from './animeSearch.js';
import './firebaseConfig.js';

createApp({
    mixins: [auth, animeSearch],
    data() {
        return {
            route: window.location.hash || '',
            theme: localStorage.getItem('theme') || 'light',
            message: '',
            isVisible: false,
            messageClass: '',
            isAuthRoute: false,
            user: null,
            modalAnimes: [],
            isSearchVisible: true,
            searchQuery: '',
            showFAQModal: false,
            showPassword: false,
            isDragOver: false,
        };
    },

    created() {
        document.documentElement.className = this.theme;
        window.addEventListener('hashchange', () => {
            this.route = window.location.hash;
            this.checkAuth();
            this.checkRoute();
        });
        firebase.auth().onAuthStateChanged(user => {
            this.user = user;
            this.checkAuth();
            this.checkRoute();
        });
        this.checkHashAndShowPlayer();
        this.debouncedSearch = this.debounce(this.searchAnime, 300);
    },

    methods: {
        toggleVisibility() {
            this.isVisible = window.scrollY > 300;
        },

        scrollToTop() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        },

        checkRoute() {
            this.isAuthRoute = (this.route === '#login' || this.route === '#reg' || this.route === '#forgot');
            if (this.user && this.isAuthRoute) {
                this.navigateTo('#profil');
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

        checkAuth() {
            if (!this.user && this.route === '#profil') {
                this.navigateTo('#login');
            }
        },

        checkHashAndShowPlayer() {
            const hash = window.location.hash;
            const idMatch = hash.match(/id=(\d+)/);
            if (idMatch) {
                const animeId = idMatch[1];
                this.showKodikPlayer(animeId);
            }
        },

        navigateTo(route) {
            window.location.hash = route;
        },

        debounce(func, wait) {
            let timeout;
            return function (...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        },

        toggleTheme() {
            this.theme = this.theme === 'light' ? 'dark' : 'light';
            document.documentElement.className = this.theme;
            localStorage.setItem('theme', this.theme);
        },

        forgotPage() {
            this.email = "";
            window.location.hash = "#forgot";
        },

        regPage() {
            this.email = "";
            window.location.hash = "#reg";
        },

        logPage() {
            this.email = "";
            window.location.hash = "#login";
        },

        homePage() {
            window.location.hash = "#";
        },

        handleShowMessage(payload) {
            const { message, type } = payload;
            this.showMessage(message, type);
        },

        triggerFileUpload() {
            this.$refs.fileInput.click();
        },

        async handleJsonChange(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const jsonData = JSON.parse(e.target.result);
                        const cleanedData = this.cleanJsonData(jsonData);

                        const database = firebase.database();
                        const userAnimesRef = database.ref('users/' + this.user.uid + '/animes');
                        await userAnimesRef.set(cleanedData);

                        await this.loadUserAnimes();

                        this.showMessage('Данные успешно загружены!', 'success');
                    } catch (error) {
                        this.showMessage('Ошибка при загрузке JSON файла: ' + error.message, "error");
                    }
                };
                reader.readAsText(file);
            }
        },

        cleanJsonData(jsonData) {
            if (!Array.isArray(jsonData)) {
                throw new Error("Неверный формат JSON файла. Ожидается массив объектов.");
            }

            return jsonData.map(anime => {
                if (
                    typeof anime.target_id === 'undefined' ||
                    typeof anime.target_title === 'undefined' ||
                    typeof anime.target_title_ru === 'undefined' ||
                    typeof anime.status === 'undefined' ||
                    anime.target_id === null ||
                    anime.target_title === null ||
                    anime.target_title_ru === null ||
                    anime.status === null
                ) {
                    throw new Error("Каждый объект должен содержать target_id, target_title, target_title_ru и status.");
                }

                return {
                    id: String(anime.target_id),
                    status: anime.status,
                    nameRU: anime.target_title_ru,
                    nameEN: anime.target_title
                };
            });
        },

        async openAnimeList(status) {
            if (!this.user) return;

            const database = firebase.database();
            const userAnimesRef = database.ref('users/' + this.user.uid + '/animes');

            try {
                const snapshot = await userAnimesRef.once('value');
                const userAnimesData = snapshot.val() || [];

                if (status) {
                    this.modalAnimes = userAnimesData.filter(anime => anime.status === status);
                } else {
                    this.modalAnimes = Object.values(userAnimesData);
                }
                const existingModal = document.getElementById('anime-list-modal');
                if (existingModal) {
                    existingModal.remove();
                }

                this.showModal();
            } catch (error) {
                console.error("Ошибка при загрузке аниме пользователя:", error);
                this.showMessage("Ошибка при загрузке аниме пользователя.", "error");
            }
        },

        showModal() {
            this.isSearchVisible = false;
            const modal = document.createElement('div');
            modal.id = 'anime-list-modal';
            const content = document.createElement('div');
            const closeButton = document.createElement('span');
            closeButton.classList.add("material-symbols-outlined", "close");
            closeButton.innerText = 'close';
            closeButton.style.cursor = 'pointer';
            closeButton.style.float = 'right';
            closeButton.style.setProperty('font-size', '17px', 'important');

            closeButton.addEventListener('click', () => {
                this.closeModal(modal);
            });

            content.appendChild(closeButton);

            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    this.closeModal(modal);
                }
            });

            if (this.modalAnimes.length > 0) {
                const animeList = document.createElement('div');
                animeList.style.listStyle = 'num';
                animeList.style.display = 'flex';
                animeList.style.flexDirection = 'column';
                animeList.style.gap = '5px';

                this.modalAnimes.forEach(anime => {
                    const listItem = document.createElement('li');
                    listItem.textContent = anime.nameRU || anime.nameEN || 'Аниме без названия';
                    animeList.appendChild(listItem);
                });
                content.appendChild(animeList);
            } else {
                const noAnimesMessage = document.createElement('p');
                noAnimesMessage.textContent = 'Нет аниме в этом списке.';
                content.appendChild(noAnimesMessage);
            }

            modal.appendChild(content);
            document.body.appendChild(modal);
            const pageElement = document.querySelector('.page');
            if (pageElement) {
                pageElement.appendChild(modal);
            } else {
                console.error('Элемент с классом "page" не найден.');
            }
        },

        closeModal(modal) {
            modal.remove();
            this.isSearchVisible = true;
        },

        openFAQModal() {
            this.showFAQModal = true;
        },
        closeFAQModal() {
            this.showFAQModal = false;
        },
        handleKeyDown(event) {
            if (event.key === 'Escape' && this.showFAQModal) {
                this.closeFAQModal();
            }
        },
    },
    mounted() {
        window.addEventListener('scroll', this.toggleVisibility);
        window.addEventListener('show-message', (event) => {
            const { message, type } = event.detail;
            this.showMessage(message, type);
        });
        window.addEventListener('keydown', this.handleKeyDown);
        this.toggleVisibility();
    },
    beforeUnmount() {
        window.removeEventListener('scroll', this.toggleVisibility);
        window.removeEventListener('show-message', this.handleShowMessage);
        window.removeEventListener('keydown', this.handleKeyDown);
    }
}).mount('#app');



// spark

class ClickSpark extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.root = document.documentElement;
      this.svg;
    }
  
    get activeEls() {
      return this.getAttribute("active-on");
    }
  
    connectedCallback() {
      this.setupSpark();
  
      this.root.addEventListener("click", (e) => {
        if (this.activeEls && !e.target.matches(this.activeEls)) return;
  
        this.setSparkPosition(e);
        this.animateSpark();
      });
    }
  
    animateSpark() {
      let sparks = [...this.svg.children];
      let size = parseInt(sparks[0].getAttribute("y1"));
      let offset = size / 2 + "px";
  
      let keyframes = (i) => {
        let deg = `calc(${i} * (360deg / ${sparks.length}))`;
  
        return [
          {
            strokeDashoffset: size * 3,
            transform: `rotate(${deg}) translateY(${offset})`
          },
          {
            strokeDashoffset: size,
            transform: `rotate(${deg}) translateY(0)`
          }
        ];
      };
  
      let options = {
        duration: 660,
        easing: "cubic-bezier(0.25, 1, 0.5, 1)",
        fill: "forwards"
      };
  
      sparks.forEach((spark, i) => spark.animate(keyframes(i), options));
    }
  
    setSparkPosition(e) {
      let rect = this.root.getBoundingClientRect();
  
      this.svg.style.left =
        e.clientX - rect.left - this.svg.clientWidth / 2 + "px";
      this.svg.style.top =
        e.clientY - rect.top - this.svg.clientHeight / 2 + "px";
    }
  
    setupSpark() {
      let template = `
        <style>
          :host {
            display: contents;
          }
          
          svg {
            pointer-events: none;
            position: absolute;
            rotate: -20deg;
            z-index:9999
          }
  
          line {
            stroke-dasharray: 30;
            stroke-dashoffset: 30;
            transform-origin: center;
            stroke: tomato  ; 
          }
        </style>
        <svg width="30" height="30" viewBox="0 0 100 100" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="4">
          ${Array.from(
            { length: 8 },
            (_) => `<line x1="50" y1="30" x2="50" y2="4"/>`
          ).join("")}
        </svg>
      `;
  
      this.shadowRoot.innerHTML = template;
      this.svg = this.shadowRoot.querySelector("svg");
    }
  }
  
  customElements.define("click-spark", ClickSpark);
