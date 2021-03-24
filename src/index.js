// Styles
import "normalize.css";
import "./styles.scss";

// Parcel + babel + async func issue
import 'regenerator-runtime/runtime';

// Helpers
Handlebars.registerHelper('inFavorites', function (movieId, options) {
    if (isInFavorites(movieId, 'favorites')) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
})

const apiPath = 'https://my-json-server.typicode.com/moviedb-tech/movies/list';

async function getApi(url, componentDataset) {
    loader(componentDataset);
    const response = await fetch(url);
    if (!response.ok) {
        throw `${response.status}: ${response.statusText}`;
    }
    return await response.json();
}

function getLocalStorage(lcItemName) {
    return JSON.parse(window.localStorage.getItem(lcItemName));
}

function setLocalStorage(lcItemName, data) {
    return window.localStorage.setItem(lcItemName, JSON.stringify(data));
}

function loader(componentDataset) {
    return document.querySelector(`[data-template="${componentDataset}"]`).innerHTML = 'Loading...';
}

function render(data, componentDataset) {
    const componentTemplate = document.querySelector(`[data-template="${componentDataset}-template"]`).innerHTML;
    const component = document.querySelector(`[data-template="${componentDataset}"]`);
    const componentRenderFn = Handlebars.compile(componentTemplate);
    component.innerHTML = componentRenderFn(data);
}

// Router
function dispatch() {
    const singleMovieId = location.hash ? location.hash.slice(1) : "";
    processSingleMovie(singleMovieId);
}

// Movies list
function processMoviesList() {
    const componentDataset = 'movies-list';
    getApi(apiPath, componentDataset).then(data => {
        render({
            api: data,
            favorites: getLocalStorage('favorites')
        }, componentDataset);
    });
}

// Single movie
function processSingleMovie(singleMovieId) {
    const componentDataset = 'single-movie';
    toggleModal(singleMovieId);
    if (!singleMovieId) {
        window.location.hash = '';
    } else {
        getApi(`${apiPath}/${singleMovieId}`, componentDataset).then(data => {
            render({
                api: data,
                favorites: getLocalStorage('favorites')
            }, componentDataset);
        });
    }
}

function toggleModal(singleMovieId) {
    const bodyClass = 'modal-opened';
    const modalClass = 'modal--open';
    if (singleMovieId) {
        document.body.classList.add(bodyClass);
        document.querySelector('.js-modal').classList.add(modalClass);
    } else {
        document.body.classList.remove(bodyClass);
        document.querySelector('.js-modal').classList.remove(modalClass);
    }
}

function singleMovieListener() {
    document.addEventListener('click',function(e){
        if (e.target && e.target.classList.contains('js-toggleModal')){
            e.preventDefault();
            processSingleMovie();
        }
    });
}

// Favorites
function processFavorites(movieToFavorites) {
    const componentDataset = 'favorites';
    if (movieToFavorites) {
        let favoritesList = getFavorites(componentDataset);
        if (isInFavorites(movieToFavorites.id, componentDataset)) {
            favoritesList = favoritesList.filter(movie => +movie.id !== +movieToFavorites.id)
        } else {
            favoritesList.push(movieToFavorites);
        }
        setLocalStorage(componentDataset, favoritesList);
        toggleFavorites(movieToFavorites.id);
    }
    render({
        favorites: getLocalStorage(componentDataset)
    }, componentDataset);
}

function toggleFavorites(movieId) {
    const starButtons = document.querySelectorAll(`.js-toggleFavorites[data-movieid="${movieId}"]`);
    starButtons.forEach(function (button) {
        button.classList.toggle('btn-star--active');
    });
}

function getFavorites(lcItemName) {
    let favoritesList = getLocalStorage(lcItemName);
    if (!favoritesList) {
        favoritesList = [];
        setLocalStorage(lcItemName, favoritesList);
    }
    return favoritesList;
}

function isInFavorites(movieToFavoritesId, lcItemName) {
    return getFavorites(lcItemName).find(movie => +movie.id === +movieToFavoritesId);
}

function favoritesListener() {
    document.addEventListener('click',function(e){
        if (e.target && e.target.classList.contains('js-toggleFavorites')){
            e.preventDefault();
            processFavorites({
                id: e.target.dataset.movieid,
                name: e.target.dataset.moviename
            });
        }
    });
}

// Init function
window.addEventListener("DOMContentLoaded", function () {
    dispatch();
    window.addEventListener("hashchange", dispatch);

    processMoviesList();

    singleMovieListener();

    processFavorites();
    favoritesListener();
});