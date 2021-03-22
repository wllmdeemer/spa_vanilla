// Styles
import "normalize.css";
import "./styles.scss";

// Parcel + babel + async func issue
import 'regenerator-runtime/runtime';

// Helpers
Handlebars.registerHelper('favorite', function (movieId, options) {
    if (isFavorite(movieId)) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
})

const apiPath = 'https://my-json-server.typicode.com/moviedb-tech/movies/list';

async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw `${response.status}: ${response.statusText}`;
    }
    return await response.json();
}

function render(data, elemTemplate) {
    elemTemplate = `${elemTemplate}-template`;
    const elem = document.querySelector(`[data-template="${elemTemplate}"]`);
    const elemLayout = elem.innerHTML;
    const elemRender = Handlebars.compile(elemLayout);
    return elemRender(data);
}

function dispatch() {
    const singleMovieId = location.hash ? location.hash.slice(1) : "";
    if (singleMovieId) {
        handleData('single-movie', singleMovieId);
    }
}

function clickListener(elemClass, callback) {
    document.addEventListener('click',function(e){
        if (e.target && e.target.classList.contains(elemClass)){
            e.preventDefault();
            callback();
        }
    });
}

// Handle data
function handleData(elemTemplate, singleMovieId = '') {
    const elem = document.querySelector(`[data-template="${elemTemplate}"]`);
    elem.innerHTML = 'Loading...';
    if (singleMovieId) toggleModal();
    fetchData(`${apiPath}/${singleMovieId}`).then(data => {
        elem.innerHTML = render({
            api: data,
            favorites: getFavorites()
        }, elemTemplate);
    });
}

function handleLocalStorage(elemTemplate) {
    const elem = document.querySelector(`[data-template="${elemTemplate}"]`);
    elem.innerHTML = render({
            favorites: getFavorites()
        }, elemTemplate);
}

// Favorites
function getFavorites() {
    let favoritesList = window.localStorage.getItem('favorites');
    return JSON.parse(favoritesList);
}

function isFavorite(movieId) {
    const inFavorites = getFavorites().find(movieInFavorites => +movieInFavorites.id === +movieId);
    if (inFavorites) {
        return inFavorites.id;
    }
    return false;
}

function toggleFavorites(movieId) {
    const starButtons = document.querySelectorAll(`.js-toggleFavorites[data-movieid="${movieId}"]`);
    starButtons.forEach(function (button) {
        button.classList.toggle('btn-star--active');
    });
}

function favoritesListener() {
    document.addEventListener('click',function(e){
        if (e.target && e.target.classList.contains('js-toggleFavorites')){
            e.preventDefault();
            handleFavorites(e.target.dataset.movieid, e.target.dataset.moviename);
            handleLocalStorage('favorites-list');
        }
    });
}

function handleFavorites(movieId, movieName) {
    let favoritesList = getFavorites();
    let inFavorite = isFavorite(movieId);
    if (inFavorite) {
        favoritesList = favoritesList.filter((movie) => +movie.id !== +inFavorite);
    } else {
        favoritesList.push({
            id: movieId,
            name: movieName
        });
    }
    toggleFavorites(movieId);
    window.localStorage.setItem('favorites', JSON.stringify(favoritesList));
}

// Modal
function toggleModal() {
    const modal = document.querySelector('.js-modal');
    const openClass = 'modal--open';
    if (modal.classList.contains(openClass)) {
        modal.classList.remove(openClass);
        window.location.hash = '';
        document.body.style.overflow = '';
    } else {
        modal.classList.add(openClass);
        document.body.style.overflow = 'hidden';
    }
}

function modalListener() {
    document.addEventListener('click',function(e){
        if (e.target && e.target.classList.contains('js-toggleModal')){
            e.preventDefault();
            toggleModal();
        }
    });
}

// Init function
document.addEventListener("DOMContentLoaded", function () {
    handleData('movies-list');
    handleLocalStorage('favorites-list');

    dispatch();
    addEventListener("hashchange", dispatch);

    modalListener();
    favoritesListener();
});



