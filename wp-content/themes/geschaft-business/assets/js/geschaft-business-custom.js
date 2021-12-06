jQuery(function($){
 "use strict";
  jQuery('.gb_navigation > ul').superfish({
    delay:       500,
    animation:   {opacity:'show',height:'show'},
    speed:       'fast'
  });
});

function geschaft_business_gb_Menu_open() {
	jQuery(".side_gb_nav").addClass('show');
}
function geschaft_business_gb_Menu_close() {
	jQuery(".side_gb_nav").removeClass('show');
}

jQuery(function($){
	$('.gb_toggle').click(function () {
    geschaft_business_Keyboard_loop($('.side_gb_nav'));
  });
});

jQuery(window).scroll(function(){
  if (jQuery(this).scrollTop() > 120) {
    jQuery('.wrap_figure').addClass('fixed');
  } else {
    jQuery('.wrap_figure').removeClass('fixed');
  }
});

jQuery(window).load(function() {
  jQuery(".preloader").delay(2000).fadeOut("slow");
});