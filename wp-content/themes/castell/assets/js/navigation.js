/**
 * File navigation.js.
 *
 * Handles toggling the navigation menu for small screens and enables TAB key
 * navigation support for dropdown menus.
 */
( function() {
	var bizzmo_container, bizzmo_button, bizzmo_menu, bizzmo_links, i, len;

	bizzmo_container = document.getElementById( 'site-navigation' );
	if ( ! bizzmo_container ) {
		return;
	}

	bizzmo_button = bizzmo_container.getElementsByTagName( 'button' )[0];
	if ( 'undefined' === typeof bizzmo_button ) {
		return;
	}

	bizzmo_menu = bizzmo_container.getElementsByTagName( 'ul' )[0];

	// Hide menu toggle button if menu is empty and return early.
	if ( 'undefined' === typeof bizzmo_menu ) {
		bizzmo_button.style.display = 'none';
		return;
	}

	bizzmo_menu.setAttribute( 'aria-expanded', 'false' );
	if ( -1 === bizzmo_menu.className.indexOf( 'navbar-nav' ) ) {
		bizzmo_menu.className += 'navbar-nav';
	}

	bizzmo_button.onclick = function() {
		if ( -1 !== bizzmo_container.className.indexOf( 'toggled' ) ) {
			bizzmo_container.className = bizzmo_container.className.replace( ' toggled', '' );
			bizzmo_button.setAttribute( 'aria-expanded', 'false' );
			bizzmo_menu.setAttribute( 'aria-expanded', 'false' );
		} else {
			bizzmo_container.className += ' toggled';
			bizzmo_button.setAttribute( 'aria-expanded', 'true' );
			bizzmo_menu.setAttribute( 'aria-expanded', 'true' );
		}
	};

	// Get all the link elements within the menu.
	bizzmo_links    = bizzmo_menu.getElementsByTagName( 'a' );

	// Each time a menu link is focused or blurred, toggle focus.
	for ( i = 0, len = bizzmo_links.length; i < len; i++ ) {
		bizzmo_links[i].addEventListener( 'focus', toggleFocus, true );
		bizzmo_links[i].addEventListener( 'blur', toggleFocus, true );
	}

	/**
	 * Sets or removes .focus class on an element.
	 */
	function toggleFocus() {
		var self = this;

		// Move up through the ancestors of the current link until we hit .nav-menu.
		while ( -1 === self.className.indexOf( 'navbar-nav' ) ) {

			// On li elements toggle the class .focus.
			if ( 'li' === self.tagName.toLowerCase() ) {
				if ( -1 !== self.className.indexOf( 'focus' ) ) {
					self.className = self.className.replace( ' focus', '' );
				} else {
					self.className += ' focus';
				}
			}

			self = self.parentElement;
		}
	}

/**
	 * Toggles `focus` class to open Menu.
	 */
bizzmo_button.onfocus = function() {
		if ( -1 !== bizzmo_container.className.indexOf( 'toggled' ) ) {
			bizzmo_container.className = bizzmo_container.className.replace( ' toggled', '' );
			bizzmo_button.setAttribute( 'aria-expanded', 'false' );
			bizzmo_menu.setAttribute( 'aria-expanded', 'false' );
		} else {
			bizzmo_container.className += ' toggled';
			bizzmo_button.setAttribute( 'aria-expanded', 'true' );
			bizzmo_menu.setAttribute( 'aria-expanded', 'true' );
		}
	};
	/**
	 * Toggles `focus` class to allow submenu access on tablets.
	 */
	( function( bizzmo_container ) {
		var touchStartFn, i,
			parentLink = bizzmo_container.querySelectorAll( '.menu-item-has-children > a, .page_item_has_children > a' );

		if ( 'ontouchstart' in window ) {
			touchStartFn = function( e ) {
				var menuItem = this.parentNode, i;

				if ( ! menuItem.classList.contains( 'focus' ) ) {
					e.preventDefault();
					for ( i = 0; i < menuItem.parentNode.children.length; ++i ) {
						if ( menuItem === menuItem.parentNode.children[i] ) {
							continue;
						}
						menuItem.parentNode.children[i].classList.remove( 'focus' );
					}
					menuItem.classList.add( 'focus' );
				} else {
					menuItem.classList.remove( 'focus' );
				}
			};

			for ( i = 0; i < parentLink.length; ++i ) {
				parentLink[i].addEventListener( 'touchstart', touchStartFn, false );
			}
		}
	}( bizzmo_container ) );
} )();
