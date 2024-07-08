#! /bin/bash
 
mkdir api-specs | true
echo "[" > api-specs/api-specs-list.json
aws apigateway get-rest-apis | jq -c -r '.items[]' | while read i;
do 
    id=$(echo $i | jq -r '.id')
    name=$(echo $i | jq -r '.name')
    
    for stage in $(aws apigateway get-stages --rest-api-id $id | jq -r '.item[].stageName');
    do
        aws apigateway get-export --rest-api-id $id --stage-name "$stage" --export-type swagger api-specs/${stage}-${name}.json
        echo "{\"url\": \"specs/"${stage}"-"${name}".json\", \"name\": \""${stage}"-"${name}"\"}," >> api-specs/api-specs-list.json
    done
 
done
truncate -s-2  api-specs/api-specs-list.json
echo "]" >> api-specs/api-specs-list.json