function showTime() {
	document.getElementById('currentTime').innerHTML = new Date().toUTCString();
}
showTime();
setInterval(function () {
	showTime();
}, 1000);
const revealCards = () => {
    const cards = document.querySelectorAll('.testi-card');
    cards.forEach(card => {
        const cardTop = card.getBoundingClientRect().top;
        if (cardTop < window.innerHeight - 100) {
            card.classList.add('active');
        }
    });
};

window.addEventListener('scroll', revealCards);
window.addEventListener('load', revealCards);