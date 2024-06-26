const left = document.getElementById('left');
const right = document.getElementById('right');
const bar = document.getElementById('dragbar');

const drag = (e) => {
  document.selection ? document.selection.empty() : window.getSelection().removeAllRanges();
  left.style.width = (e.pageX - bar.offsetWidth / 2) + 'px';
}

bar.addEventListener('mousedown', () => {
  document.addEventListener('mousemove', drag);
});

document.addEventListener('mouseup', () => {
  document.removeEventListener('mousemove', drag);
});

// Logic App controlNavigation
const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const playList = $('.playlist__play-songs')
const songImg = $('.current-song--img')
const songName = $('.current-song--name')
const songArtist = $('.current-song--artist')
const audio = $('#audio')

const progress = $('#progress')
const timeLeft = $('.time-left')
const timeRight = $('.time-right')

const controlNavigation = $('#control--navigation')
const toggleBtns = $$('.btn-toggle')

const volumeControl = $('#volumeProgressBar');
const volumeBtn = $('.btn-volume');

const backwardSong = $('.btn-backward')
const forwardSong = $('.btn-forward')

const randomSong = $('.btn-random')
const repeatSong = $('.btn-repeat')

const api = 'https://lemanh-api.onrender.com/songs'

var iconPage = $('link[rel="shortcut icon"]');
var titlePage = $('title')

const app = {
  currentIndex: 0,
  isPlaying: false,
  isRepeat: false,
  isRandom: false,
  songs: [],
  async fetchSongs() {
    this.isFetching = true;
    try {
      const response = await fetch(api);
      const songs = await response.json();
      this.songs = songs;
    } finally {
      this.isFetching = false;
    }
  },
  render() {
    const htmls = this.songs.map((song , index) => {
      return `
      <div class="playlist__row ${index === this.currentIndex ? 'activeSong' : ''}" data-index="${index}">
        <p class="playlist__row--index opa-7">
            <span>${song.id}</span>
            <svg class="icon" viewBox="0 0 24 24"><path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"></path></svg>
        </p>
        <div class="playlist__play-songs--title playlist__row--title">
            <img src="${song.img}" alt="">
            <div>
                <h5>${song.name}</h5>
                <p>${song.singer}</p>
            </div>
        </div>
        <p class="playlist__row--album opa-7">${song.singer}</p>
        <p class="playlist__row--date opa-7">Ngày thêm</p>
        <p class="playlist__row--time opa-7">Thời lượng</p>
      </div>
      `
    })
    playList.innerHTML = htmls.join('')
  },
  defineProperties() {
    if (!Object.getOwnPropertyDescriptor(this, 'currentSong')) {
        Object.defineProperty(this, 'currentSong', {
            get currentSong() {
                return this.songs[this.currentIndex];
            }                
        });
    }
  },
  get currentSong() {
      return this.songs[this.currentIndex];
  },
  handleEvents() {
    const _this = this

    toggleBtns.forEach(toggleBtn => {
      toggleBtn.onclick = () => {
        if(_this.isPlaying) {
          audio.pause()
        } else {
          audio.play()
        }
      }
    })
    progress.value = 0; // Trả thanh progress lại từ đầu
      
    audio.onplay = () => {
        _this.isPlaying = true
        controlNavigation.classList.add('playing')
        right.classList.add('playing')
      }
      // Khi Song được Pause 
      audio.onpause = () => {
        _this.isPlaying = false
        controlNavigation.classList.remove('playing')
        right.classList.remove('playing')
    }
    audio.onloadedmetadata = () => progress.max = audio.duration 
    progress.onchange = () => audio.currentTime = progress.value
  
    // Next song
    forwardSong.onclick = () => {
      if(_this.isRandom) {
          _this.playRandomSong()
      }
      else {
          _this.nextSong();
      }
      _this.loadCurrentSong();
      _this.playSong();
      _this.render()
      _this.changeIconPage()
    };

    // Previous song
    backwardSong.onclick = () => {
        if(_this.isRandom) {
            _this.playRandomSong()
        }
        else {
            _this.prevSong();
        }
        _this.loadCurrentSong();
        _this.playSong();
        _this.render()
        _this.changeIconPage()

    };

    // Random song 
    randomSong.onclick = () => {
        _this.isRandom = !_this.isRandom
        randomSong.classList.toggle('active' , _this.isRandom)
        _this.playSong()
        _this.render()
        _this.changeIconPage()
    }
    
    // Xử lý khi Audio kết thúc 
    // Next Audio 

    audio.onended = () => {
        if (this.isRepeat) {
            this.playSong();
        } else {
            forwardSong.onclick();
        }
    };

    // Repeat
    repeatSong.onclick = () => {
        _this.isRepeat = !_this.isRepeat
        repeatSong.classList.toggle('active' , _this.isRepeat)
        audio.onended = () => {
          if(_this.isRepeat) {
              _this.playSong()
          }
        }
    }
    playList.onclick = (e) => {
      const songNode = e.target.closest('.playlist__row:not(.activeSong)');
      if (songNode) {  // Trừ click vào bài hát đang phát
          // Xử lý click vào song
          const indexSongNode = songNode ? Number(songNode.getAttribute('data-index')) : null;
          if (indexSongNode !== null) {
            songNode.onclick = () => {
                _this.currentIndex = indexSongNode;
                _this.loadCurrentSong();
                _this.playSong();
                _this.render();
                _this.changeIconPage()
            };
        }
      }
    };
    // Volume change
    // Add these lines at the beginning of the handleEvent method

    // Add volume control event handling
    volumeBtn.onclick = () => {
        audio.muted = !audio.muted;
        volumeBtn.classList.toggle('muted', audio.muted);
    };

    volumeControl.oninput = () => {
      audio.volume = volumeControl.value / 100; // Chia cho 100 để đảm bảo giá trị nằm trong khoảng từ 0 đến 1
    };

    audio.volume = 1;
    volumeControl.value = 100
    
    // Update the volume progress bar when the volume changes
    audio.onvolumechange = () => {
        volumeControl.value = audio.volume * 100;
        volumeBtn.classList.toggle('muted', audio.muted);
    };

    // Time
    audio.ontimeupdate = () => {
        progress.value = audio.currentTime;
        timeLeft.innerText = _this.formatTime(audio.currentTime);
        timeRight.innerText = _this.formatTime(audio.duration);
    };

  },
  changeIconPage() {
    iconPage.href = this.songs[this.currentIndex].img
    titlePage.innerText = this.songs[this.currentIndex].name
  },
  removeSong(index) {
      this.songs.splice(index, 1);
      if (this.currentIndex === index) {
          // If the removed song is the current song, move to the next song
          this.nextSong();
          this.loadCurrentSong();
          this.playSong();
      } else if (this.currentIndex > index) {
          // If the removed song is before the current song, adjust the current index
          this.currentIndex--;
      }
      this.render();
  },
  formatTime(time) {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  },
  playRandomSong() {
      let randomIndex;
      do {
          randomIndex = Math.floor(Math.random() * this.songs.length);
      } while (randomIndex === this.currentIndex);

      this.currentIndex = randomIndex;
      this.loadCurrentSong();
  },    
  nextSong() {
      this.currentIndex = (this.currentIndex + 1) % this.songs.length; // Chia lấy dư 
      // VD: CurrentIndex = 3 => 4 / 4 dư 0 gán lại vào current Index
  },

  prevSong() {
      this.currentIndex = (this.currentIndex - 1 + this.songs.length) % this.songs.length;
      // VD: CurrentIndex = 0 => (-1 + 4) / 4 dư 3 gán lại vào current Index

  },
  playSong() {
      if (audio.readyState === 4) { // Kiểm tra xem audio đã load xong chưa (readyState = 4 là đã load xong)
          audio.play();
      } else {
          // Nếu chưa load xong, thì chờ sự kiện 'canplay' trước khi play
          audio.addEventListener('canplay', () => {
              audio.play();
          });
      }
  },
  loadCurrentSong() {
    songImg.src = this.currentSong.img
    songName.textContent = this.currentSong.name
    songArtist.textContent = this.currentSong.singer
    audio.src = this.currentSong.path
  },
  start() {
    // Định nghĩa thuộc tính cho OBJ
    this.defineProperties();

    // Xử lý DOM Event
    this.handleEvents();

    // Fetch songs and render playlist
    this.fetchSongs().then(() => {
        this.render();
        this.loadCurrentSong();
    });
  },
}
app.start()
