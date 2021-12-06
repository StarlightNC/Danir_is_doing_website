( function( $, settings ) { 

$( function() { 
	happyForms.dashboard.openModal( 'onboarding' );

	$( document ).on( 'submit', '.happyforms-modal__frame--onboarding form', function( e ) {
		e.preventDefault();

		var $form = $( e.target );
		var email = $( 'input[type="email"]', $form ).val();
		email = email ? email : '';
		var poweredBy = $( 'input[type="checkbox"]', $form ).is( ':checked' ) ? 1 : 0;

		$.post( ajaxurl, {
			action: settings.action,
			email: email, 
			powered_by: poweredBy, 
		} );

		happyForms.dashboard.closeModal();
	} );
} );

} )( jQuery, _happyFormsOnboardingSettings );