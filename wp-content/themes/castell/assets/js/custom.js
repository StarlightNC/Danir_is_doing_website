/*--------------------------------------------------

    JS INDEX
    ================================================
    * preloader js
    * scroll to top js
    * sticky menu js
    * toggle search
    * navigation mobile menu
    * magnific popup
    * service 3 slider js
    * box mouse-enter hover
    ================================================*/

(function ($) {
  "use strict";
  var $main_window = $(window);

  /*====================================
  preloader js
  ======================================*/
  $main_window.on("load", function () {
    $(".preloader").fadeOut("slow");
  });


  /*====================================
    Isotop And Masonry
  ======================================*/
  if ($(".masonary-wrap").length > 0) {
    $main_window.on('load', function () {
      var $grid = $('.masonary-wrap').isotope({
        itemSelector: '.mas-item',
        percentPosition: true,
        masonry: {
          columnWidth: '.mas-item'
        }
      });
      $('.sorting').on('click', '.filter-btn', function () {
        var filterValue = $(this).attr('data-filter');
        $grid.isotope({
          filter: filterValue
        });
      });
      $('.sorting li').on('click', function (event) {
        $(".filter-btn").removeClass('active');
        $(this).addClass('active');
        event.preventDefault();
      });
    });
  }
  /*====================================
  scroll to top js
  ======================================*/
  $(window).on("scroll", function () {
    if ($(this).scrollTop() > 250) {
      $("#c-scroll").fadeIn(200);
    } else {
      $("#c-scroll").fadeOut(200);
    }
  });
  $("#c-scroll").on("click", function () {
    $("html, body").animate({
        scrollTop: 0
      },
      "slow"
    );
    return false;
  });

  /*====================================
     sticky menu js
  ======================================*/

  $main_window.on('scroll', function () {
    var scroll = $(window).scrollTop();
    if (scroll >= 200) {
      $(".affix").addClass("sticky-menu");
    } else {
      $(".affix").removeClass("sticky-menu");
    }
  });
  
  
  /*====================================
  toggle search
  ======================================*/
  $('.menu-search a').on("click", function () {
    $('.menu-search-form').toggleClass('s-active');
  });

  /*====================================
  Accessible mobile menu
  ======================================*/
   var $bizzmo  = $( window );

    function bizzmoaccessible() {
        jQuery( document ).on( 'keydown', function( e ) {
            if ( $bizzmo.width() > 992 ) {
                return;
            }
            var activeElement = document.activeElement;
            var menuItems = jQuery( '#nav-content .menu-item > a' );
            var firstEl = jQuery( '.menu-toggle' );
            var lastEl = menuItems[ menuItems.length - 1 ];
            var tabKey = event.keyCode === 9;
            var shiftKey = event.shiftKey;
            if ( ! shiftKey && tabKey && lastEl === activeElement ) {
                event.preventDefault();
                firstEl.focus();
            }
        } );
    }

     $(document).ready(function () {
      bizzmoaccessible();
    });
  /*====================================
      navigation mobile menu
  ======================================*/

  function mainmenu() {
    $('.dropdown-menu a.dropdown-toggle').on('click', function (e) {
      if (!$(this).next().hasClass('show')) {
        $(this).parents('.dropdown-menu').first().find('.show').removeClass("show");
      }
      var $subMenu = $(this).next(".dropdown-menu");
      $subMenu.toggleClass('show');

      return false;
    });
  }
  mainmenu();


  /*====================================
     magnific popup
   ======================================*/
  if ($('.project').length > 0) {
    $('.project').magnificPopup({
      delegate: '.pop-btn',
      type: 'image',
      gallery: {
        enabled: true
      },
      removalDelay: 300,
      mainClass: 'mfp-fade'
    });
  }

  /*====================================
		service 3 slider js
	======================================*/

  var service3slider = $(".service-3slider");
  service3slider.owlCarousel({
    autoplay: true,
    nav: false,
    autoplayHoverPause: false,
    smartSpeed:1500,
    dots: false,
    margin:0,
    loop: true,
    navText: [
      '<i class="fa fa-arrow-left"></i>',
      '<i class="fa fa-arrow-right"></i>'
    ],
    responsiveClass: true,
    responsive: {
      0: {
        items: 1,
      },
      575: {
        items: 2,
      },
      991: {
        items: 4,
      },
      1199: {
        items: 5,
      }
    }
  });

  /*======================================
    box mouse-enter hover
   ====================================== */
  var BoxHover = function () {
    jQuery('.box-hover').on('mouseenter', function () {
      jQuery(this).closest('.row').find('.box-hover').removeClass('active');
      jQuery(this).addClass('active');
    });
  };
  BoxHover();

})(jQuery);