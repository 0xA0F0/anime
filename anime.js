new Vue({
    el: '#app',
    data() {
        return {
            animes: [],
            currentPage: 1,
            page: 25,
            searchQuery: '',
            lastSearchQuery: localStorage.getItem('lastSearchQuery') || '',
            isEmpty: false,
            loading: false,
            cache: {},
            window: false,
            kodikLink: '',
            ShikimoriId: '', 
            title: '', 
            error: '', 
            OrderEnum: 'ranked',
            forbidden: 'https://placehold.co/191x271?text=18',
            infoVisible: false,
            showDescription: null,
        };
    },
    created() {
        this.initializePage();
    },
    methods: {
        initializePage() {
            const urlParams = new URLSearchParams(window.location.search);
            const page = parseInt(urlParams.get('page'), 10);
            const search = urlParams.get('search');
            
            if (!isNaN(page) && page > 0) {
                this.currentPage = page;
            }

            if (search) {
                this.searchQuery = search;
                this.lastSearchQuery = search;
                localStorage.setItem('lastSearchQuery', search);
            }
            
            this.fetchAnimes();
        },
        async fetchAnimes() {
            this.loading = true;
            try {
                const query = `
                    {
                        animes(
                            limit: ${this.page}
                            page: ${this.currentPage}
                            kind: "!special"
                            search: "${this.searchQuery}"
                            order: ${this.OrderEnum}
                        ) {
                            id
                            score
                            russian
                            poster { preview2xUrl }
                            genres { id name }  
                            status
                            descriptionHtml
                        }
                    }
                `;
                
                const cacheKey = `${this.searchQuery}_${this.currentPage}`;
                if (this.cache[cacheKey]) {
                    this.animes = this.filterAndReplaceImages(this.cache[cacheKey]);
                    this.loading = false;
                    this.isEmpty = this.animes.length === 0;
                    return;
                }

                const response = await axios.post('https://shikimori.one/api/graphql', {
                    query
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const fetchedAnimes = response.data.data.animes || [];
                this.animes = this.filterAndReplaceImages(fetchedAnimes.map(anime => ({
                    ...anime,
                    status: this.ruStatus(anime.status)
                })));
                this.cache[cacheKey] = this.animes;
                this.isEmpty = this.animes.length === 0;
            } catch (error) {
                this.showError('Ошибка при получении данных: ' + error.message);
                this.animes = [];
                this.isEmpty = true;
            } finally {
                this.loading = false;
            }
        },
        ruStatus(status) {
            switch (status) {
                case 'ongoing':
                    return { text: 'В процессе', class: 'ongoing' };
                case 'released':
                    return { text: 'Выпущено', class: 'released' };
                case 'anons':
                    return { text: 'Анонсировано', class: 'anons' };
                default:
                    return { text: 'Неизвестно', class: 'unknown' };
            }
        },
        filterAndReplaceImages(animes) {
            return animes.map(anime => {
                const isHentai = anime.genres.some(genre => genre.name.toLowerCase() === 'hentai');
                const placeholderImage = isHentai ? this.forbidden : anime.poster.preview2xUrl;

                return {
                    ...anime,
                    poster: {
                        preview2xUrl: placeholderImage
                    }
                };
            });
        },
        hasDescription(descriptionHtml) {
            const div = document.createElement('div');
            div.innerHTML = descriptionHtml;
            const text = div.querySelector('.b-text_with_paragraphs')?.innerText.trim();
            return !!text;
        },
        async searchAnimes() {
            this.lastSearchQuery = this.searchQuery;
            localStorage.setItem('lastSearchQuery', this.lastSearchQuery);
            this.currentPage = 1;
            this.updatePage();
        },
        clearSearchQuery() {
            this.searchQuery = '';
            this.currentPage = 1;
            this.updatePage();
        },
        nextPage() {
            this.currentPage += 1;
            this.updatePage();
        },
        previousPage() {
            if (this.currentPage > 1) {
                this.currentPage -= 1;
                this.updatePage();
            }
        },
        updatePage() {
            const url = new URL(window.location);
            url.searchParams.set('page', this.currentPage);
            if (this.searchQuery) {
                url.searchParams.set('search', this.searchQuery);
            } else {
                url.searchParams.delete('search');
            }
            window.history.pushState({}, '', url);
            this.fetchAnimes();
        },
        async showKodikPlayer(anime) {
            this.ShikimoriId = anime.id;
            this.title = anime.russian; 
            this.status = anime.status;
            this.descriptionHtml = anime.description;
            this.score = anime.score;
            const kodikUrl = `https://kodikapi.com/search?token=50e058ac7c2b71a73ee87e4fea333544&types=anime-serial,anime&shikimori_id=${this.ShikimoriId}`;
            
            try {
                const response = await axios.get(kodikUrl);
                const data = response.data;

                if (data.results.length === 0) {
                    throw new Error('Аниме не найдено в базе данных.');
                }

                const kodikAnime = data.results[0];
                if (!kodikAnime.link) {
                    throw new Error('Ошибка');
                }

                this.kodikLink = kodikAnime.link.startsWith('http') ? kodikAnime.link : `https:${kodikAnime.link}`;
                this.window = true;
            } catch (error) {
                this.showError(error.message);
            }
        },
        close() {
            this.window = false;
        },
        showError(message) {
            this.error = message;
            setTimeout(() => {
                this.error = '';
            }, 3000); 
        },
        showInfo() {
            this.infoVisible = true;
        },
        closeInfo() {
            this.infoVisible = false;
        },
        restoreLastSearch() {
            this.searchQuery = this.lastSearchQuery;
            this.currentPage = 1;
            this.updatePage();
        }
    }
});



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


  //confetti

import confetti from 'https://cdn.skypack.dev/canvas-confetti';

function launchConfetti(event) {
    const el = event.currentTarget;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (left + width / 2) / window.innerWidth;
    const y = (top + height / 2) / window.innerHeight;

     confetti({
        particleCount: 100,
        spread: 70, 
        startVelocity: 30,
        angle: -270, 
        origin: { x, y },
        disableForReducedMotion: true
    });
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.hs').forEach(element => {
        element.addEventListener('click', launchConfetti);
    });
});
