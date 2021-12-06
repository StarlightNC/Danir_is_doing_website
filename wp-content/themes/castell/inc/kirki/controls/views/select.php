<div class="kirki-input-container" data-id="{{ data.id }}">
	<label>
		
			<span class="customize-control-title">{{{ data.label }}}</span>
		
		
			<span class="description customize-control-description">{{{ data.description }}}</span>
		
		<select data-id="{{ data['data-id'] }}" data.inputattrs if data.multiple>
				data-multiple="{{ data.multiple }}" multiple="multiple"
			
			>
			
				<option value="" if data.value> selected></option>
			
			
				
					<optgroup label="{{ optionLabel[0] }}">
						
							
							<option value="{{ optgroupOptionKey }}" if selected> selected>{{{ optgroupOptionLabel }}}</option>
						
					</optgroup>
				
					<option value="{{ optionKey }}" if selected> selected>{{{ optionLabel }}}</option>
				
			
		</select>
	</label>
</div>