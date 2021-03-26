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

Handlebars.registerHelper('isCurrentView', function (view, options) {
    if (getLocalStorage('movies-view') === view) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
})

const apiPath = 'https://my-json-server.typicode.com/moviedb-tech/movies/list';

async function getApi(url, loaderComponent) {
    if (loaderComponent) loader(loaderComponent);
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
    let singleMovieId = location.hash.match(/^#?\/?movie\/([0-9]+)$/);
    if (singleMovieId) {
        processSingleMovie(singleMovieId[1]);
    }
}

// Movies controls
function processMoviesControls() {
    const componentDataset = 'movies-controls';
    getApi(apiPath, componentDataset).then(apiData => {

        let moviesGenres = {};
        const currentGenre = getLocalStorage('current-genre');
        apiData.forEach(movie => {
            movie.genres.forEach(genre => {
                moviesGenres[genre.toLowerCase()] = {
                    name: genre,
                    isCurrent: genre.toLowerCase() === currentGenre
                };
            });
        });

        const lcMoviesViesName = 'movies-view';
        const moviesView = getLocalStorage(lcMoviesViesName) ? getLocalStorage(lcMoviesViesName) : setLocalStorage(lcMoviesViesName, 'cards');

        render({
            moviesGenres,
            moviesView
        }, componentDataset);

        filterGenreListener();
        processMoviesList(apiData);
    });
}

function filterGenreListener() {
    document.querySelector('.js-filterGenres').addEventListener('change', e => {
        setLocalStorage('current-genre', e.target.value);
        processMoviesList();
    });
}

function filterViewListener() {
    document.addEventListener('click',function(e){
        if (e.target && e.target.classList.contains('js-filterView')){
            e.preventDefault();
            let currentMoviesView = getLocalStorage('movies-view');
            const targetView = e.target.dataset.view;
            if (targetView === currentMoviesView) {
                return false;
            } else {
                toggleMoviesView(currentMoviesView, targetView);
            }
        }
    });
}

function toggleMoviesView(currentMoviesView, targetView) {
    const activeViewClass = 'filter-view__item--active';
    setLocalStorage('movies-view', targetView);
    document.querySelectorAll('.js-filterView').forEach(button => {
        if (button.dataset.view !== targetView) {
            button.classList.remove(activeViewClass);
        } else {
            button.classList.add(activeViewClass);
        }
    });

    const moviesViewNodes = document.querySelectorAll('[class*="--movies-view--"]');
    moviesViewNodes.forEach(elem => {
        let prevClass = '';
        let newClassPrefix = '';
        elem.classList.forEach(elemClass => {
            const matchRegex = elemClass.match(/^(.*--movies-view--).*$/);
            if (matchRegex) {
                prevClass = matchRegex[0];
                newClassPrefix = matchRegex[1];
            }
        });
        elem.classList.remove(prevClass);
        elem.classList.add(`${newClassPrefix}${targetView}`);
    });
}

// Movies list
function processMoviesList(apiData) {
    const componentDataset = 'movies-list';
    if (apiData) {
        renderMoviesList(apiData, componentDataset);
    } else {
        getApi(apiPath, componentDataset).then(data => {
            renderMoviesList(data, componentDataset)
        })
    }
}

function renderMoviesList(apiData, componentDataset) {
    render({
        api: filterMoviesList(apiData),
        favorites: getLocalStorage('favorites'),
        moviesView: getLocalStorage('movies-view')
    }, componentDataset);
}

function filterMoviesList(moviesList) {
    const currentGenre = getLocalStorage('current-genre');
    if (currentGenre) {
        let filteredMoviesList = [];
        moviesList.forEach(movie => {
            movie.genres.forEach(genre => {
                if (genre.toLowerCase() === currentGenre) filteredMoviesList.push(movie);
            });
        });
        return filteredMoviesList;
    } else {
        return moviesList;
    }
}

// Single movie
function processSingleMovie(singleMovieId) {
    const componentDataset = 'single-movie';
    toggleModal(singleMovieId);
    if (!singleMovieId) {
        window.location.hash = '/';
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

    processMoviesControls();
    filterViewListener();

    singleMovieListener();

    processFavorites();
    favoritesListener();
});