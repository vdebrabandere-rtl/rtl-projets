// Define the LyricsApp web component
class LyricsApp extends HTMLElement {
    constructor() {
        super();
        this.id = this.getAttribute("id");
        this.originLink = "https://vdebrabandere-rtl.github.io/rtl-github/ressources/contact-max/";
        this.dataOrigin = this.originLink + "lyrics/json/";
        this.imageOrigin = this.originLink + "lyrics/cover/";
        this.soundOrigin = this.originLink + "lyrics/sounds/";
        this._data = null;
        this.freeScroll = false;
        this.isAutoScrolling = false;
        this.currentLine = null;
        this.handleScroll = this.handleScroll.bind(this);
    }

    connectedCallback() {
        this.fetchDatas().then(() => {
            this.render();
            this.generateLyrics(this._data.lyrics);
            this.content = this.querySelector(".c-content");
            this.player = this.querySelector("custom-player");
            this.resetButton = this.querySelector(".c-reset-button");
            this.headerHeight = this.querySelector(".c-header").clientHeight;

            this.initEventListeners();
            this.initHeader();
        });
    }

    disconnectedCallback() {
        if (this.content) {
            this.content.removeEventListener("scroll", this.handleScroll);
        }
        clearTimeout(this.autoScrollTimeout);
    }

    async fetchDatas() {
        const link = this.dataOrigin + this.id + ".json";

        try {
            const response = await fetch(link);
            if (!response.ok) {
                throw new Error("Failed to fetch lyric data");
            }
            this._data = await response.json();
        } catch (error) {
            console.error("Error:", error);
        }
    }
    render() {
        const content = `
        <div class="c-top-bar">
            <div class="c-header sticky">
                <div class="c-header__icon">
                    <img class="c-header__img" src="${this.imageOrigin}${this.id}.jpeg" alt="${this._data.name}">
                </div>
                <div class="c-header__text">
                    <h3 class="c-header__title">${this._data.title}</h3>
                    <p class="c-header__subtitle">${this._data.name}</p>
                </div>
            </div>
            <button class="c-download-button">
                <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.4946 15.9706V19.9706C21.4946 20.501 21.2839 21.0097 20.9088 21.3848C20.5338 21.7599 20.0251 21.9706 19.4946 21.9706H5.49463C4.9642 21.9706 4.45549 21.7599 4.08042 21.3848C3.70534 21.0097 3.49463 20.501 3.49463 19.9706V15.9706" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7.49463 10.9706L12.4946 15.9706L17.4946 10.9706" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12.4946 15.9706V3.97058" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        </div>
        <div class="c-content">
            <div class="c-header">
                <div class="c-header__icon">
                    <img class="c-header__img" src="${this.imageOrigin}${this.id}.jpeg" alt="${this._data.name}">
                </div>
                <div class="c-header__text">
                    <h3 class="c-header__title">${this._data.title}</h3>
                    <p class="c-header__subtitle">${this._data.name}</p>
                    <p class="c-header__function">${this._data.function}</p>
                </div>
            </div>
            <div class="c-lyrics"></div>
        </div>
        <button class="c-reset-button">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24.008 14.1V42M12 26L24 14L36 26M12 6H36" stroke="white" stroke-width="4" stroke-linecap="round"
                    stroke-linejoin="round" />
            </svg>
        </button>
        <custom-player src="${this.soundOrigin}${this.id}.mp3""></custom-player>
        <div class="c-app__bg">
            <img class="c-app__img" src="${this.imageOrigin}${this.id}.jpeg" alt="Photo floue de l'animateur en background">
        </div>
        <div class="c-app__bar"></div>
        `;
        this.innerHTML = `${content}`;
    }

    generateLyrics(lyrics) {
        const lyricsContainer = this.querySelector(".c-lyrics");
        lyricsContainer.innerHTML = ""; // Clear existing content

        lyrics.forEach((line) => {
            const lyricElement = document.createElement("p");
            lyricElement.classList.add("c-lyrics__line");
            if (line.note) {
                lyricElement.classList.add("c-past-lyrics");
            }
            lyricElement.setAttribute("data-time", line.time);
            lyricElement.textContent = line.line || "";
            lyricElement.addEventListener("click", () => {
                const time =
                    parseFloat(lyricElement.getAttribute("data-time")) / 1000;
                this.player.seek(time);
                this.isAutoScrolling = true;
                this.freeScroll = false;
                this.resetButton.classList.remove("active");
                this.alignLyrics();
            });
            lyricsContainer.appendChild(lyricElement);
        });
        this.alignLyrics();
    }

    initEventListeners() {
        this.resetButton.addEventListener("click", () => {
            this.resetLyrics();
        });

        const downloadButton = this.querySelector('.c-download-button');
        downloadButton.addEventListener('click', () => {
            const link = this.originLink + "lyrics/text/" + this._data.id +".pdf";
            window.open(link, '_blank');
        });

        this.content.addEventListener("scroll", this.handleScroll);
        this.player.onTimeUpdate((currentTime) => {
            const time = currentTime * 1000;
            const nextLineIndex = this._data.lyrics.findIndex(
                (line) => line.time > time
            );
            if (
                nextLineIndex !== -1 &&
                this._data.lyrics[nextLineIndex] !== this.currentLine
            ) {
                this.currentLine = this._data.lyrics[nextLineIndex];
                const lyricsLines = this.querySelectorAll(".c-lyrics__line");
                lyricsLines.forEach((line, index) => {
                    index = index + 1;
                    line.classList.toggle(
                        "highlighted",
                        index === nextLineIndex
                    );
                    line.classList.toggle(
                        "c-past-lyrics",
                        index < nextLineIndex
                    );
                });
                this.alignLyrics();
            }
        });
    }

    handleScroll() {
        if (!this.isAutoScrolling) {
            if (!this.freeScroll) {
                this.freeScroll = true;
                this.resetButton.classList.add("active");
            }
        } else {
            clearTimeout(this.autoScrollTimeout);
            this.autoScrollTimeout = setTimeout(() => {
                this.isAutoScrolling = false;
            }, 100);
        }
    
        // Check scroll position
        const contentScrollTop = this.content.scrollTop;
        const threshold = 50; // Adjust threshold if needed
    
        if (contentScrollTop > threshold) {
            this.classList.add("scrolled");
        } else {
            this.classList.remove("scrolled");
        }
    }

    alignLyrics() {
        if (!this.freeScroll) {
            this.isAutoScrolling = true;
            const highlighted = this.querySelector(
                ".c-lyrics__line.highlighted"
            );

            if (highlighted) {
                const highlightPosition = highlighted.offsetTop - this.content.offsetTop  + this.headerHeight + highlighted.clientHeight; // Position of the highlighted line within the content
                const offset = 100 - this.headerHeight;
                // Calculate the target scroll top position
                let targetScrollTop = highlightPosition - (this.headerHeight - 72);
            
                this.content.scrollTo({
                    top: targetScrollTop,
                    behavior: "smooth",
                });
            }
            
        }
    }

    updateLyrics(currentTime) {
        const time = currentTime * 1000;
        const nextLineIndex = this._data.lyrics.findIndex(
            (line) => line.time > time
        );

        if (
            nextLineIndex !== -1 &&
            this._data.lyrics[nextLineIndex] !== this.currentLine
        ) {
            this.currentLine = this._data.lyrics[nextLineIndex];
            const lyricsLines = this.querySelectorAll(".c-lyrics__line");
            lyricsLines.forEach((line, index) => {
                index = index + 1;
                line.classList.toggle("highlighted", index === nextLineIndex);
                line.classList.toggle("c-past-lyrics", index < nextLineIndex);
            });

            this.alignLyrics();
        }
    }

    resetLyrics() {
        this.freeScroll = false;
        this.isAutoScrolling = true;
        this.resetButton.classList.remove("active");
        this.alignLyrics();
    }

    play() {
        if (this.player) this.player.play();
    }

    pause() {
        if (this.player) this.player.pause();
    }

    seek(time) {
        if (this.player) this.player.currentTime = time;
    }
}
customElements.define("lyrics-app", LyricsApp);
class customPlayer extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.src = this.getAttribute("src");
        this.assetsOrigin = "https://raw.githubusercontent.com/vdebrabandere-rtl/ressources/main/contact-rebrand/assets/svg/";
        this.render();
        this.video = this.querySelector("video");
        this.playPauseButton = this.querySelector(".c-player__play");
        this.playPauseIcon = this.playPauseButton.querySelector("img");
        this.initEventListeners();
    }

    render() {
        const content = `
            <div class="c-player">
                <button class="c-player__play"><img src="${this.assetsOrigin}/play.svg" alt="Play icon"></button>
                <div class="c-player__wave">
                    <img src="${this.assetsOrigin}/wavform.svg" alt="waveform transparent" class="c-player__wave-svg">
                    <img src="${this.assetsOrigin}/wavform.svg" alt="waveform transparent" class="c-player__wave-svg c-player__wave-svg--clipped">
                    <img src="${this.assetsOrigin}/wavform.svg" alt="waveform transparent" class="c-player__wave-svg c-player__wave-svg--hover">
                </div>
                <video controlslist="nodownload" _autoplay="" name="media" oncontextmenu="return false;">
                    <source src="${this.src}" type="audio/mpeg" />
                </video>
            </div>
        `;

        this.innerHTML = `${content}`;
    }

    initEventListeners() {
        const wave = this.querySelector('.c-player__wave');
        const clippedWave = this.querySelector('.c-player__wave-svg--clipped');

        this.playPauseButton.addEventListener("click", () => this.togglePlayPause());

        this.video.addEventListener("timeupdate", () => this.updateClip(clippedWave));

        this.video.addEventListener("ended", () => {
            this.playPauseIcon.src = `${this.assetsOrigin}/play.svg`;
        });

        wave.addEventListener("click", e => this.calculSeek(e, wave));
        wave.addEventListener("mousemove", e => this.hoverWave(e, wave));
        wave.addEventListener("mouseleave", () => this.leaveWave());
    }

    togglePlayPause() {
        const allPlayers = document.querySelectorAll('custom-player');
        allPlayers.forEach(player => {
            if (player !== this && !player.video.paused) {
                player.video.pause();
                player.playPauseIcon.src = `${player.assetsOrigin}/play.svg`;
            }
        });
    
        if (this.video.paused) {
            this.video.play();
            this.playPauseIcon.src = `${this.assetsOrigin}/pause.svg`;
        } else {
            this.video.pause();
            this.playPauseIcon.src = `${this.assetsOrigin}/play.svg`;
        }
    }
    

    updateClip(clippedWave) {
        const percentage = this.video.currentTime / this.video.duration * 100;
        clippedWave.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
        requestAnimationFrame(() => this.updateClip(clippedWave));
    }

    calculSeek(e, wave) {
        if (!this.video) {
            console.error("Video element is not available");
            return;
        }
        const rect = wave.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / wave.offsetWidth;
        this.video.currentTime = percentage * this.video.duration;
    }

    hoverWave(e, wave) {
        const hoverWave = this.querySelector('.c-player__wave-svg--hover');
        const rect = wave.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / wave.offsetWidth;
        hoverWave.style.clipPath = `inset(0 ${100 - percentage * 100}% 0 0)`;
    }

    leaveWave() {
        const hoverWave = this.querySelector('.c-player__wave-svg--hover');
        hoverWave.style.clipPath = 'inset(0 100% 0 0)';
    }

    getCurrentTime() {
        return this.video.currentTime;
    }

    seek(time) {
        this.video.currentTime = time;
    }

    onTimeUpdate(callback) {
        this.video.addEventListener("timeupdate", () => callback(this.video.currentTime));
    }
}

customElements.define("custom-player", customPlayer);

document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        const focusedPlayer = document.activeElement.closest('custom-player');
        console.log(focusedPlayer)
        if (focusedPlayer) {
            focusedPlayer.togglePlayPause();
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Select all videos that require scroll-based sound adjustment or autoplay
    const videos = document.querySelectorAll('.js-scroll-sound, .js-autoplay');

    const observerOptions = {
        root: null, // Use the viewport as the root
        threshold: [0, 0.5, 1] // Multiple thresholds for finer control
    };

    const videoVisibilityChanged = (entries, observer) => {
        entries.forEach(entry => {
            // Handle autoplay and pause for .js-autoplay videos
            if (entry.target.classList.contains('js-autoplay')) {
                if (entry.isIntersecting) {
                    entry.target.play();
                } else {
                    entry.target.pause();
                }
            }
        });
    };

    const observer = new IntersectionObserver(videoVisibilityChanged, observerOptions);
    videos.forEach(video => observer.observe(video));

    // Function to adjust volume based on scroll for .js-scroll-sound videos
    const adjustVideoVolumeOnScroll = () => {
        videos.forEach(video => {
            if (!video.classList.contains('js-scroll-sound')) return;

            const videoRect = video.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            let volume = 1;

            // Adjust volume based on the video's vertical position in the viewport
            if (videoRect.top < viewportHeight && videoRect.bottom > 0) {
                // Video is partially visible
                const visibleHeight = Math.min(videoRect.bottom, viewportHeight) - Math.max(videoRect.top, 0);
                volume = visibleHeight / videoRect.height;
            } else if (videoRect.bottom <= 0 || videoRect.top >= viewportHeight) {
                // Video is completely out of view
                volume = 0;
            }

            video.volume = Math.max(0, Math.min(volume, 1)); // Ensure volume is between 0 and 1
        });
    };

    // Adjust volume on scroll and on load
    window.addEventListener('scroll', adjustVideoVolumeOnScroll);
    adjustVideoVolumeOnScroll();
});



// Code for handling keyboard events remains the same
const button = document.querySelector('.c-loading__button');

setTimeout(() => {
    button.classList.add('visble');
}, 0);

    // Event listener for the button click
    button.addEventListener('click', function() {
    // Hide the loading screen
    window.scrollTo(0, 0);
    document.querySelector('.c-loading-screen').style.display = 'none';
    const video = document.querySelector('.c-header__video');
    video.play();
});