( function( $, settings ) {

	var dashboardInit = happyForms.dashboard.init;

	happyForms.dashboard = $.extend( {}, happyForms.dashboard, {
		init: function() {
			dashboardInit.apply( this, arguments );

			$( document ).on( 'click', '#adminmenu #toplevel_page_happyforms a[href="#settings"]', this.openUpgradeModal );
			$( document ).on( 'click', '#adminmenu #toplevel_page_happyforms a[href="#integrations"]', this.openUpgradeModal );
		},

		openUpgradeModal: function( e ) {
			e.preventDefault();

			happyForms.modals.openUpgradeModal();
		},
	} );

} )( jQuery, _happyFormsAdmin );
