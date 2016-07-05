#################
# DOWNLOAD DATA #
#################

data/gz/DC_Boundary.zip:
	mkdir -p $(dir $@)
	curl "http://opendata.dc.gov/datasets/7241f6d500b44288ad983f0942b39663_10.zip" -o $@.download
	mv $@.download $@

# Owner Poly layer
data/gz/Owner_Polygons_Common_Ownership_Layer.zip:
	mkdir -p $(dir $@)
	curl "http://opendata.dc.gov/datasets/1f6708b1f3774306bef2fa81e612a725_40.zip" -o $@.download
	mv $@.download $@

# DC Ward layer
data/gz/Ward__2012.zip:
	curl "http://opendata.dc.gov/datasets/0ef47379cbae44e88267c01eaec2ff6e_31.zip" -o $@.download
	mv $@.download $@

#Input files for CSV conversion:
data/pdf/Blighted\ Buildings_2015\ 2nd\ half\ (dcra.gov).pdf:
	mkdir -p $(dir $@)
	curl "http://dcra.dc.gov/sites/default/files/dc/sites/dcra/publication/attachments/Blighted%20Buildings_2015%202nd%20half%20%28dcra.gov%29.pdf" -o $@.download
	mv $@.download $@

data/pdf/Vacant\ Buildings_2015\ 2nd\ half\ (dcra.gov).pdf:
	mkdir -p $(dir $@)
	curl "http://dcra.dc.gov/sites/default/files/dc/sites/dcra/publication/attachments/Vacant%20Buildings_2015%202nd%20half%20%28dcra.gov%29.pdf" -o $@.download
	mv $@.download $@

#DC Neighborhoods via http://www.opendatadc.org/en/dataset/neighborhood-boundaries-217-neighborhoods-washpost-justgrimes
data/json/dcneighorhoodboundarieswapo.geojson:
	mkdir -p $(dir $@)
	curl "http://ec2-54-235-58-226.compute-1.amazonaws.com/storage/f/2013-05-12T03%3A50%3A18.251Z/dcneighorhoodboundarieswapo.geojson" -o $@.download
	mv $@.download $@

#data/csv is created using tabula 1.10beta1 & excel. In the case of the vacant files, you need to use a formula
# =CONCATENATE(TEXT(F2,"0000  "),"  ",IF(G2,TEXT(G2,"0000"),""))
# in order to merge the two halves of the SSL, some of the fields like "PAR 01240117  0000" will need to be pasted with values and edited to remove the 0000's.
# In blighted, replace " " with "    " for SSL
# add Blighted = 2 and Vacant = 1 for every row.
# for vancant, empty ~7 places where SSL is blank besides per page error.

#################
# UNCOMPRESS DATA #
#################

# get the outer polygon of DC
data/shp/DC_Boundary.shp: data/gz/DC_Boundary.zip
	rm -rf $(basename $@)
	mkdir -p $(basename $@)
	unzip -d $(basename $@) $<
	for file in $(basename $@)/*; do chmod 644 $$file; mv $$file $(basename $@).$${file##*.}; done
	rmdir $(basename $@)
	touch $@

data/shp/Ward__2012.shp: data/gz/Ward__2012.zip
	rm -rf $(basename $@)
	mkdir -p $(basename $@)
	unzip -d $(basename $@) $<
	for file in $(basename $@)/*; do chmod 644 $$file; mv $$file $(basename $@).$${file##*.}; done
	rmdir $(basename $@)
	touch $@

# Owner Poly layer
data/shp/Owner_Polygons_Common_Ownership_Layer.shp: data/gz/Owner_Polygons_Common_Ownership_Layer.zip
	rm -rf $(basename $@)
	mkdir -p $(basename $@)
	unzip -d $(basename $@) $<
	for file in $(basename $@)/*; do chmod 644 $$file; mv $$file $(basename $@).$${file##*.}; done
	rmdir $(basename $@)
	touch $@

	#################
	# RESHAPE DATA  #
	#################

data/topojson/DC_Boundary_Lines.json: data/shp/DC_Boundary.shp
	mapshaper -i $< -simplify 20% -lines -o format=topojson $@

data/topojson/DC_Ward_Boundary_Lines.json: data/shp/Ward__2012.shp
	mapshaper -i $< -simplify 20% -lines -o format=topojson $@

# Licensed noncommercial, do not use right now.
# data/topojson/DC_Neighborhood_Lines.json: data/json/dcneighorhoodboundarieswapo.geojson
# 	mapshaper -i $< -simplify 20% -lines -o format=topojson $@

# Owner Poly layer
data/json/owners-wVacant.geojson: data/shp/Owner_Polygons_Common_Ownership_Layer.shp
	mkdir -p $(dir $@)
	mapshaper -i $< \
	-filter-fields "SSL, ZIP5, ZIP4, STREETNAME, STREETCODE,SHAPEAREA,OBJECTID,ADDRESS1,ADDRESS2,CITYSTZIP,TAXRATE,QDRNTNAME,PREMISEADD,VACLNDUSE" \
	-join data/csv/vacants.csv keys=SSL,SSLFULL:str fields=GGStatus:num unjoined unmatched -o format=geojson $@
	mv $(basename $@)2.geojson $(dir $@)unmatched-w-vacants.geojson
	mv $(basename $@)3.geojson $(dir $@)unjoined-vacants.json
	mv $(basename $@)1.geojson $@

data/json/owners-wBlighted.geojson: data/json/owners-wVacant.geojson
	mapshaper -i $< -join data/csv/blighted.csv keys=SSL,SSL:str fields=GGStatus:num sum-fields=GGStatus unjoined -o $@
	mv $(basename $@)2.geojson $(dir $@)unjoined-w-blighted.geojson
	mv $(basename $@)1.geojson $@

data/json/owners-wBlighted-target-only.json: data/json/owners-wBlighted.geojson
	mkdir -p $(dir $@)
	mapshaper -i $< -filter "$$.properties.GGStatus >= 1" -o format=geojson $@


#Single unified TopoJSON of only Blighted/Vacant
data/topojson/owners-wBlighted-target-only.json: data/json/owners-wBlighted.geojson
	mkdir -p $(dir $@)
	mapshaper -i $< -filter "$$.properties.GGStatus >= 1" -o format=topojson $@

data/topojson/fake-user-edits-NE.json: data/json/fake-user-edits-NE.geojson
	mkdir -p $(dir $@)
	mapshaper -i $< -filter "$$.properties.GGStatus >= 1" -o format=topojson $@

#################
# Prep JSON for Quadrant TopoJSON #
#################

data/json/quads/all/%.json: data/json/owners-wBlighted.geojson
	rm -rf $(dir $@)
	mkdir -p $(dir $@)
	mapshaper -i $< -split QDRNTNAME -o format=geojson $(dir $@)

data/json/quads/target/%.json: data/json/owners-wBlighted.geojson
	rm -rf $(dir $@)
	mkdir -p $(dir $@)
	mapshaper -i $< -filter "$$.properties.GGStatus >= 1" -split QDRNTNAME -o format=geojson $(dir $@)

data/json/quads/other/%.json: data/json/owners-wBlighted.geojson
	rm -rf $(dir $@)
	mkdir -p $(dir $@)
	mapshaper -i $< -filter "$$.properties.GGStatus < 1" -split QDRNTNAME -o format=geojson $(dir $@)

#Create Quadrant TopoJSON
data/topojson/quads/target/owners-wBlighted-%.json: data/json/quads/target/owners-wBlighted-$*.json
	mkdir -p $(dir $@)
	mapshaper -i $(dir $<)owners-wBlighted-$*.json -o cut-table id-field=SSL format=topojson $(dir $@)

data/topojson/quads/other/owners-wBlighted-%.json: data/json/quads/other/owners-wBlighted-$*.json
	mkdir -p $(dir $@)
	mapshaper -i $(dir $<)owners-wBlighted-$*.json -o cut-table id-field=SSL format=topojson $(dir $@)

data/topojson/quads/all/owners-wBlighted-%.json: data/json/quads/all/owners-wBlighted-$*.json
	mkdir -p $(dir $@)
	mapshaper -i $(dir $<)owners-wBlighted-$*.json -o cut-table id-field=SSL format=topojson $(dir $@)

quads-target: data/topojson/quads/target/owners-wBlighted-NW.json data/topojson/quads/target/owners-wBlighted-NE.json data/topojson/quads/target/owners-wBlighted-SW.json data/topojson/quads/target/owners-wBlighted-SE.json
quads-other: data/topojson/quads/other/owners-wBlighted-NW.json data/topojson/quads/other/owners-wBlighted-NE.json data/topojson/quads/other/owners-wBlighted-SW.json data/topojson/quads/other/owners-wBlighted-SE.json
quads: data/topojson/owners-wBlighted-target-only.json quads-target quads-other data/topojson/quads/all/owners-wBlighted-NW.json data/topojson/quads/all/owners-wBlighted-NE.json data/topojson/quads/all/owners-wBlighted-SW.json data/topojson/quads/all/owners-wBlighted-SE.json

	#################
	# SHORTCUTS     #
	#################

bord-lines: data/topojson/DC_Boundary_Lines.json data/topojson/DC_Ward_Boundary_Lines.json
blight-vacant-only: data/topojson/owners-wBlighted-target-only.json
prepare-map: bord-lines blight-vacant-only



	#########
	# CLEAN #
	#########


clean: clean-local
	rm -rf data/gz

clean-local:
	rm -rf data/shp data/json data/topojson

#clean-json:
#	rm -rf data/json
