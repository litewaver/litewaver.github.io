
    
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

    