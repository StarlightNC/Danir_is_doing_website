<div class="kirki-input-container" data-id="' + data.id + '">
	<label>
		
			<span class="customize-control-title">{{{ data.label }}}</span>
		
		
			<span class="description customize-control-description">{{{ data.description }}}</span>
		
		<div class="customize-control-content">
			<textarea data-id="{{ data['data-id'] }}" data.inputattrs _.each data.choices function val key>
					{{ key }}="{{ val }}"
				
			>{{{ data.value }}}</textarea>
		</div>
	</label>
</div>