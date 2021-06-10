## Elements of LokiDB

A memory resident document store based on collections. Can persist data to disk through various adapters. Works in Node and also Browser. 

### Basic Usage

* create a new Loki instance, or load a .loki file into one.
* Add/Remove/Update Collections, which are arrays of Objects of your making.
* Query Collections for their records to retrieve a ResultSet
* Perform operations on ResultSets, like filtering, sorting, statistics...
* Update records or remove records from the Collection

There are two means of searching:

* where - these let you define a filter function for result sets
* find - these use MongoDB-style operators 



### Collection

```
configureOptions
setTTL

get
insert
update
remove

by (field,value) => object


find
findAndRemove
findAndUpdate
findOne

where
updateWhere
removeWhere

avg
count
max
median
min
extract
extractNumerical
maxRecord
minRecord
stdDev
mode

clear

chain

mapReduce

checkAllIndexes
checkIndex
ensureAllIndexes
ensureIndex

eqJoin

addDynamicView
getDynamicView
removeDynamicView

addTransform
getTransform
removeTransform
setTransform

commitStage
getStage
stage
```



### ResultSet

```
data
branch / copy

count

update
where

eqJoin

find
remove

map
mapReduce

sort
compoundsort
simplesort

transform

```

