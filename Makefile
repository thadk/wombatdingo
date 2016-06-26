#################
# DOWNLOAD DATA #
#################

# Owner Poly layer
data/gz/Owner_Polygons_Common_Ownership_Layer.zip:
	mkdir -p $(dir $@)
	curl "http://opendata.dc.gov/datasets/1f6708b1f3774306bef2fa81e612a725_40.zip" -o $@.download
	mv $@.download $@


data/pdf/Blighted\ Buildings_2015\ 2nd\ half\ (dcra.gov).pdf:
	mkdir -p $(dir $@)
	curl "http://dcra.dc.gov/sites/default/files/dc/sites/dcra/publication/attachments/Blighted%20Buildings_2015%202nd%20half%20%28dcra.gov%29.pdf" -o $@.download
	mv $@.download $@

data/pdf/Vacant\ Buildings_2015\ 2nd\ half\ (dcra.gov).pdf:
	mkdir -p $(dir $@)
	curl "http://dcra.dc.gov/sites/default/files/dc/sites/dcra/publication/attachments/Vacant%20Buildings_2015%202nd%20half%20%28dcra.gov%29.pdf" -o $@.download
	mv $@.download $@

#data/csv is created using tabula. In the case of the vacant files, you need to use a formula
# =CONCATENATE(TEXT(F2,"0000  "),"  ",IF(G2,TEXT(G2,"0000"),""))
# in order to merge the two halves of the SSL, some of the fields like "PAR 01240117  0000" will need to be pasted with values and edited to remove the 0000's.

# Owner Poly layer
data/shp/Owner_Polygons_Common_Ownership_Layer.shp: data/gz/Owner_Polygons_Common_Ownership_Layer.zip
	rm -rf $(basename $@)
	mkdir -p $(basename $@)
	unzip -d $(basename $@) $<
	for file in $(basename $@)/*; do chmod 644 $$file; mv $$file $(basename $@).$${file##*.}; done
	rmdir $(basename $@)
	touch $@

# Owner Poly layer
data/json/owners-wVacant.geojson: data/shp/Owner_Polygons_Common_Ownership_Layer.shp
	mkdir -p $(dir $@)
	#rm data/json/unmatched-w-vacants.geojson data/json/unjoined-vacants.json data/json/owners-wVacant.geojson
	mapshaper -i $< \
	-filter-fields "SSL, ZIP5, ZIP4, STREETNAME, STREETCODE,SHAPEAREA,OBJECTID,ADDRESS1,ADDRESS2,CITYSTZIP,TAXRATE,QDRNTNAME,PREMISEADD,VACLNDUSE" \
	-join data/csv/vacants.csv keys=SSL,SSLFULL:str unjoined unmatched -o format=geojson $@
	mv $(basename $@)2.geojson $(dir $@)unmatched-w-vacants.geojson
	mv $(basename $@)3.geojson $(dir $@)unjoined-vacants.json
	mv $(basename $@)1.geojson $@

data/json/owners-wBlighted.geojson: data/json/owners-wVacant.geojson
	mapshaper -i $< -join data/csv/blighted.csv keys=SSL,SSL:str unjoined -o $@
	mv $(basename $@)2.geojson $(dir $@)unjoined-w-blighted.geojson
	mv $(basename $@)1.geojson $@

data/json/quads/%: data/json/owners-wBlighted.geojson
	rm -rf $(dir $@)
	mkdir -p $(dir $@)
	mapshaper -i $< -split QDRNTNAME -o format=geojson $(dir $@)

data/topojson/quads/owners-wBlighted-%.json: data/json/quads/owners-wBlighted-$*.json
	mkdir -p $(dir $@)
	mapshaper -i $(dir $<)owners-wBlighted-$*.json -o cut-table id-field=SSL format=topojson $(dir $@)

quads: data/topojson/quads/owners-wBlighted-NW.json data/topojson/quads/owners-wBlighted-NE.json data/topojson/quads/owners-wBlighted-SW.json data/topojson/quads/owners-wBlighted-SE.json






	#########
	# CLEAN #
	#########


clean: clean-local
	rm -rf data/gz

clean-local:
	rm -rf data/shp data/json data/topojson

clean-json:
	rm -rf data/json
