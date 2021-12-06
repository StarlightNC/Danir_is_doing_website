var geschaft_business_Keyboard_loop = function (elem) {
  var geschaft_business_tabbable = elem.find('select, input, textarea, button, a').filter(':visible');
  var geschaft_business_firstTabbable = geschaft_business_tabbable.first();
  var geschaft_business_lastTabbable = geschaft_business_tabbable.last();
  /*set focus on first input*/
  geschaft_business_firstTabbable.focus();

  /*redirect last tab to first input*/
  geschaft_business_lastTabbable.on('keydown', function (e) {
    if ((e.which === 9 && !e.shiftKey)) {
      e.preventDefault();
      geschaft_business_firstTabbable.focus();
    }
  });

  /*redirect first shift+tab to last input*/
  geschaft_business_firstTabbable.on('keydown', function (e) {
    if ((e.which === 9 && e.shiftKey)) {
      e.preventDefault();
      geschaft_business_lastTabbable.focus();
    }
  });

  /* allow escape key to close insiders div */
  elem.on('keyup', function (e) {
    if (e.keyCode === 27) {
      elem.hide();
    };
  });
};