document.addEventListener('DOMContentLoaded', function() {
    const bgMusic = document.getElementById('bgMusic');
    const clickSound = document.getElementById('clickSound');
    const successSound = document.getElementById('successSound');
    let isMusicPlaying = false;

    function playClickSound() {
        if (clickSound) {
            clickSound.currentTime = 0;
            clickSound.play().catch(err => {
                console.log('Click sound not available');
            });
        }
    }

    const allInteractive = document.querySelectorAll('button, a, label.chip, input[type="checkbox"]');
    allInteractive.forEach(element => {
        element.addEventListener('click', function() {
            playClickSound();
        });
    });

    const logoImg = document.querySelector('.logo-img');
    if (logoImg) {
        logoImg.style.cursor = 'pointer';
        logoImg.addEventListener('click', function() {
            if (successSound) {
                successSound.currentTime = 0;
                successSound.play().catch(err => console.log('Success sound not available'));
            }
        });
    }

    const musicToggle = document.getElementById('musicToggle');

    if (musicToggle && bgMusic) {
        musicToggle.addEventListener('click', function() {
            if (isMusicPlaying) {
                bgMusic.pause();
                isMusicPlaying = false;
                musicToggle.style.opacity = '0.6';
            } else {
                bgMusic.play().catch(err => {
                    alert('Please add background-music.mp3 to assets folder!');
                });
                isMusicPlaying = true;
                musicToggle.style.opacity = '1';
            }
        });
    }

    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;

    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'enabled') {
        body.classList.add('dark-mode');
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            body.classList.toggle('dark-mode');

            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('darkMode', 'enabled');
            } else {
                localStorage.setItem('darkMode', 'disabled');
            }
        });
    }

    const categoryFilters = document.querySelectorAll('.category-filter');
    categoryFilters.forEach(filter => {
        filter.addEventListener('change', function() {
            if (this.value === 'all') {
                window.location.href = '/';
            } else {
                window.location.href = `/?category=${this.value}`;
            }
        });
    });

    const searchBar = document.getElementById('searchBar');
    const searchBtn = document.getElementById('searchBtn');

    if (searchBtn) {
        searchBtn.addEventListener('click', function(e) {
            if (searchBar && searchBar.value.trim() === '') {
                e.preventDefault();
            }
        });
    }

    if (searchBar) {
        searchBar.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && this.form) {
                this.form.submit();
            }
        });
    }

    console.log('Community Insight Portal loaded successfully!');
});
