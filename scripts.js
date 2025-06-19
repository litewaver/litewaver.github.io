/* import { createRoot } from 'react-dom/client';

// Clear the existing HTML content
document.body.innerHTML = '<div id="app"></div>';

// Render your React component instead
const root = createRoot(document.getElementById('app'));
root.render(<h1>Hello, world</h1>);


function MyComponent() {
    return <h1>Hello from React!</h1>;
  }
  
  ReactDOM.render(<MyComponent />, document.getElementById('react-root'));

*/


//back to top button

// Get the button
let mybutton = document.getElementById("topbtn");

// Show the button when the user scrolls down 20px from the top
window.onscroll = function() {scrollFunction()};

function scrollFunction() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    mybutton.style.display = "block";
  } else {
    mybutton.style.display = "none";
  }
}

// Scroll to the top when the button is clicked
mybutton.onclick = function() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}


mybutton.onclick = function() {
  window.scrollTo({top: 0, behavior: 'smooth'});
}



//tilt effect for photo
const cards = document.querySelectorAll('.tilt-card');

cards.forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
  });
});

//gsap animate
let nav = document.querySelector('.nav')

let tween = gsap.to(".flair", {
  duration: 2, 
  x: () => nav.offsetWidth, // animate by the px width of the nav
  xPercent: -100, // offset by the width of the box
  rotation: 360, 
  ease: "none", 
  paused: true
});


//button rotate
gsap.to(".button", { rotation: 27, x: 100, duration: 1 });




   const constraints = {
       name: {
           presence: { allowEmpty: false }
       },
       email: {
           presence: { allowEmpty: false },
           email: true
       },
       message: {
           presence: { allowEmpty: false }
       }
   };

   const form = document.getElementById('contact-form');

   form.addEventListener('submit', function (event) {
     const formValues = {
         name: form.elements.name.value,
         email: form.elements.email.value,
         message: form.elements.message.value
     };



     //back to top button 
const topbtn = document.getElementById('topbtn') as HTMLButtonElement;

window.addEventListener('scroll', () => {
  if (window.scrollY > 200) {
    topbtn.style.display = 'block';
  } else {
    topbtn.style.display = 'none';
  }
});

topbtn.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});


//toggle button 1
function myFunction() {
  var element = document.body;
  element.classList.toggle("lite-mode");
}



const button = document.createElement('button')
button.textContent = 'lite mode';
button.id = "liteMode";




//toggle button 2
const toggleButton = document.getElementById('liteMode');
const body = document.body;

toggleButton.addEventListener('click', () => {
  body.classList.toggle('liteMode');
});