// Function to load content into a specific element
function loadHTML(id, url) {
    fetch(url)
    .then(response => response.text())
    .then(data => {
    document.getElementById(id).innerHTML = data;
    })
    .catch(error => console.error('Error loading HTML:', error));
   }
   
   import { loadHeader, loadNavbar, loadSiteTitle, loadAlert, loadSkills, loadCarousel, loadSpotify, loadAbout, loadContactCard, loadFooter } from './loadContent.js';


   // Load the header, navigation, and footer
   export const loadPlaceholders = () =>
   loadHTML('header-placeholder', 'header.html');
   loadHTML('nav-placeholder', 'nav.html');
   loadHTML('footer-placeholder', 'footer.html');

   document.addEventListener('DOMContentLoaded', () => {
    loadHeader('header-placeholder');
    loadNavbar('navbar-placeholder');
    loadSiteTitle('site-title-placeholder');
    loadAlert('alert-placeholder');
    loadSkills('skills-placeholder');
    loadCarousel('carousel-placeholder');
    loadSpotify('spotify-placeholder');
    loadAbout('about-placeholder');
    loadContactCard('contact-card-placeholder');
    loadFooter('footer-placeholder');
   });