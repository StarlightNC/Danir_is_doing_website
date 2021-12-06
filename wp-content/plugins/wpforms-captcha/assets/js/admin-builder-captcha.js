/* global wpforms_builder_custom_captcha, wpforms_builder */

/**
 * WPForms Custom Captcha admin builder function.
 *
 * @since 1.1.0
 */

'use strict';

var WPFormsCaptcha = window.WPFormsCaptcha || ( function( document, window, $ ) {

	/**
	 * Public functions and properties.
	 *
	 * @since 1.1.0
	 *
	 * @type {object}
	 */
	var app = {

		/**
		 * Start the engine.
		 *
		 * @since 1.1.0
		 */
		init: function() {

			$( app.ready );
		},

		/**
		 * Initialize once the DOM is fully loaded.
		 *
		 * @since 1.1.0
		 */
		ready: function() {

			$( '#wpforms-builder' )

				// Type (format) toggle.
				.on( 'change', '.wpforms-field-option-captcha .wpforms-field-option-row-format select', app.formatToggle )

				// Add new captcha question.
				.on( 'click', '.wpforms-field-option-row-questions .add', app.addQuestion )

				// Remove captcha question.
				.on( 'click', '.wpforms-field-option-row-questions .remove', app.removeQuestion )

				// Captcha sample question update.
				.on( 'input', '.wpforms-field-option-row-questions .question', _.debounce( app.updateQuestion, 300 ) );
		},

		/**
		 * Format toggle event handler.
		 *
		 * @since 1.3.2
		 */
		formatToggle: function() {

			var $this      = $( this ),
				value      = $this.val(),
				id         = $this.parent().data( 'field-id' ),
				$questions = $( '#wpforms-field-option-row-' + id + '-questions' ),
				$size      = $( '#wpforms-field-option-row-' + id + '-size' );

			if ( value === 'math' ) {
				$questions.hide().addClass( 'wpforms-hidden' );
				$size.hide();
			} else {
				$questions.show().removeClass( 'wpforms-hidden' );
				$size.show();
			}
		},

		/**
		 * Add new captcha question event handler.
		 *
		 * @since 1.3.2
		 *
		 * @param {object} event Event object.
		 */
		addQuestion: function( event ) {

			event.preventDefault();

			var $this        = $( this ),
				$choice      = $this.closest( 'li' ),
				$choicesList = $this.closest( '.choices-list' ),
				fieldID      = $choicesList.data( 'field-id' ),
				id           = $choicesList.attr( 'data-next-id' ),
				$question    = $choice.clone().insertAfter( $choice ),
				name         = 'fields[' + fieldID + '][questions][' + id + ']';

			$question.attr( 'data-key', id );
			$question.find( 'input.question' ).val( '' ).attr( 'name', name + '[question]' );
			$question.find( 'input.answer' ).val( '' ).attr( 'name', name + '[answer]' );
			$choicesList.attr( 'data-next-id', ++id );
		},

		/**
		 * Remove captcha question event handler.
		 *
		 * @since 1.3.2
		 *
		 * @param {object} event Event object.
		 */
		removeQuestion: function( event ) {

			event.preventDefault();

			var $this        = $( this ),
				$choice      = $this.closest( 'li' ),
				$choicesList = $this.closest( '.choices-list' ),
				$questions   = $choicesList.find( '.question' ),
				fieldID      = $choicesList.data( 'field-id' ),
				total        = app.getTotalNotEmptyQuestions( $questions );

			// We can delete a choice if at least one non-empty question will remain.
			if (
				total > 1 ||
				( total === 1 && $choice.find( '.question' ).val().trim().length === 0 )
			) {
				$choice.remove();
				$( '#wpforms-field-' + fieldID ).find( '.wpforms-question' ).text( $choicesList.find( '.question' ).val() );

				return;
			}

			app.showAlert( null );
		},

		/**
		 * Captcha sample question update event handler.
		 *
		 * @since 1.3.2
		 */
		updateQuestion: function() {

			var $this        = $( this ),
				$choicesList = $this.closest( '.choices-list' ),
				$questions   = $choicesList.find( '.question' ),
				fieldID      = $choicesList.data( 'field-id' ),
				total        = app.getTotalNotEmptyQuestions( $questions ),
				value        = $this.val().trim(),
				prevValue    = $this.data( 'prev-value' ) || '';

			if ( ! value.length && total < 1 ) {
				app.showAlert( function() {
					$this.val( prevValue );
				} );

				return;
			}

			$this.data( 'prev-value', value );

			if ( $this.is( $questions[0] ) ) {
				$( '#wpforms-field-' + fieldID ).find( '.wpforms-question' ).text( value );
			}
		},

		/**
		 * Show alert notifying that at least one not empty choice should remains.
		 *
		 * @since 1.3.2
		 *
		 * @param {Function|null} action Callback action attached to the confirm button.
		 */
		showAlert: function( action ) {

			$.alert( {
				title:   false,
				content: wpforms_builder_custom_captcha.error_not_empty_question,
				icon:   'fa fa-exclamation-circle',
				type:   'orange',
				buttons: {
					confirm: {
						text:     wpforms_builder.ok,
						btnClass: 'btn-confirm',
						keys:     [ 'enter' ],
						action:   action,
					},
				},
			} );
		},

		/**
		 * Show alert notifying that at least one not empty choice should remains.
		 *
		 * @since 1.3.2
		 *
		 * @param {jQuery} $questions Questions choices jQuery object.
		 *
		 * @returns {number} Number of total not empty questions.
		 */
		getTotalNotEmptyQuestions: function( $questions ) {

			return $questions.filter( function() {

				return this.value.trim().length;
			} ).length;
		},
	};

	// Provide access to public functions/properties.
	return app;

}( document, window, jQuery ) );

// Initialize.
WPFormsCaptcha.init();
