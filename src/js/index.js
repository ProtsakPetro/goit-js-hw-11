import axios from 'axios';

export class PixabayAPI {
  #BASE_URL = 'https://pixabay.com/api/';
  #API_KEY = '38752753-3e559f3e5f741918923bcfb47';
  q = null;
  page = 1;
  async fetchPhotos() {
    const searchParams = new URLSearchParams({
      key: this.#API_KEY,
      image_type: 'photo',
      orientation: 'horizontal',
      safesearch: true,
      per_page: 40,
      q: this.q,
      page: this.page,
    });
    return await axios.get(`${this.#BASE_URL}?${searchParams}`);
  }
}

import { PixabayAPI } from '/src/js/index';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const gallery = document.querySelector('.gallery');
const searchForm = document.querySelector('.search-form');
const loadMoreBtn = document.querySelector('.load-more');
const pixabayAPI = new PixabayAPI();
const target = document.querySelector('.js-guard');
const simplelightbox = new SimpleLightbox('.gallery a', {});

const options = {
  root: null,
  rootMargin: '400px',
  threshold: 1.0,
};

const observer = new IntersectionObserver(handleIntersect, options);
searchForm.addEventListener('submit', handlerSearchForm);

function handlerSearchForm(evt) {
  evt.preventDefault();
  target.hidden = true;
  gallery.innerHTML = '';
  const searchQuery = evt.currentTarget.elements['searchQuery'].value.trim();
  pixabayAPI.q = searchQuery;
  pixabayAPI.page = 1;
  searchPhotos();
}

async function searchPhotos() {
  try {
    const { data } = await pixabayAPI.fetchPhotos();
    if (data.hits.length < 1) {
      Notify.failure(
        'There are no images matching your search. Please try to write something else.'
      );

      return;
    }
    Notify.success(`Yahoo! We found ${data.totalHits} images.`);
    gallery.insertAdjacentHTML('beforeend', createMarkup(data.hits));
    target.hidden = false;
    observer.observe(target);
    simplelightbox.refresh();
  } catch (error) {
    console.log(error);
  }
}

function handleIntersect(evt) {
  pixabayAPI.page += 1;
  if (evt[0].isIntersecting) {
    searchMorePhotos();
  }
}

async function searchMorePhotos() {
  try {
    const result = pixabayAPI.page * 40;
    const { data } = await pixabayAPI.fetchPhotos();
    gallery.insertAdjacentHTML('beforeend', createMarkup(data.hits));
    if (result >= data.totalHits) {
      observer.unobserve(target);
      Notify.failure("We're sorry, but it's the end of the search((");
      return;
    }
    simplelightbox.refresh();
  } catch (error) {}
}

function createMarkup(arr) {
  const markup = arr.map(
    ({
      webformatURL,
      largeImageURL,
      tags,
      likes,
      views,
      comments,
      downloads,
    }) =>
      `<a href="${largeImageURL}">
        <div class="photo-card">
  <img src="${webformatURL}" alt="${tags}" loading="lazy" width='350' height='200'/>
  <div class="info">
    <p class="info-item">
      <b>Likes: ${likes}</b>
    </p>
    <p class="info-item">
      <b>Views: ${views}</b>
    </p>
    <p class="info-item">
      <b>Comments: ${comments}</b>
    </p>
    <p class="info-item">
      <b>Downloads: ${downloads}</b>
    </p>
  </div>
        </div>
        </a>
        `
  );
  return markup.join('');
}
