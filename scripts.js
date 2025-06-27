
    
    import { gsap } from "gsap";
    //gsap scroll
    gsap.to('.box')
      scroll.Trigger: '.box'
      x:100



    window.onload = function() {
      var magicButton = document.getElementById("purpleGif");

      var normalButton ="resumeButton"
      var purpleGif = "./assets/star-sticker-holographic.gif";

      magicButton.addEventListener("mouseover", function () {
        magicButton.src = purpleGif;
      });

      magicButton.addEventListener("mouseout", function () {
        magicButton.src = normalButton;
      });
    };

    
    //counter
      // Get the current count from localStorage
  let count = localStorage.getItem("visitCount");

  // If no count, start from 0
  if (count === null) {
    count = 1;
  } else {
    count = parseInt(count) + 1;
  }

  // Save the updated count
  localStorage.setItem("visitCount", count);

  // Show it on the page
  document.getElementById("visit-count").innerText = count;

    fetch("visit-counter.php")
    .then(res => res.text())
    .then(count => {
      document.getElementById("global-count").innerText = count;
    });