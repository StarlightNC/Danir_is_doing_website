( function( $ ) {

	HappyForms.parts = HappyForms.parts || {};

	HappyForms.parts.select = {
		init: function( options ) {
			this.type = this.$el.data( 'happyforms-type' );

			this.$input = $( '[data-serialize]', this.$el );
			var $visualInput = $( 'input[type="text"]:not(.happyforms-select-dropdown-other)', this.$el );
			var $select = $( '.happyforms-custom-select-dropdown', this.$el );

			$visualInput.happyFormsSelect( {
				$input: this.$input,
				$select: $select,
				searchable: $visualInput.attr( 'data-searchable' ),
				required: 'undefined' === typeof this.$el.data( 'happyforms-required' ) ? false : true,
			});

			this.$input.on( 'blur', this.onBlur.bind(this) );
			this.initTooltip();
		},

		onBlur: function() {
			var $otherinput = $( '.happyforms-part-option--other input[type=text]', this.$el );
			if ( '999' === this.$input.val() ) {
				$otherinput.addClass( 'hf-show' );
				$otherinput.focus();
			} else {
				$otherinput.removeClass( 'hf-show' );
			}
		},

		serialize: function() {
			var self = this;

			var serialized = this.$input.map( function( i, input ) {
				var $input = $( input, self.$el );
				var $customInput = 0;

				if ( 999 == $input.val() ) {
					$customInput = $( ' .happyforms-part-option--other input[type=text]', self.$el );
				}

				var keyValue = {
					name: $input.attr( 'name' ),
					value: $input.val()
				};

				if ( $customInput.length ) {
					var otherValue = $customInput.val();

					keyValue['value'] = [ $input.val(), otherValue ];

					keyValue['value'] = JSON.stringify( keyValue['value'] );
				}

				return keyValue;
			} ).toArray();

			return serialized;

		}
	};

} )( jQuery );
