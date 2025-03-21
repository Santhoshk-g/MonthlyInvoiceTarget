import { LightningElement, track } from 'lwc';
import getinvoice from '@salesforce/apex/MonthlyInvoiceTarget.getinvoices';
import csvFileRead from '@salesforce/apex/MonthlyInvoiceTarget.fileupload'; 
import {ShowToastEvent} from 'lightning/platformShowToastEvent';

export default class MonthlyInvoiceTarget extends LightningElement {


    month = null;
    year = null;
    segment = null;
    region = null;
    data =[];
    error;
    isfilter = false;
    mapdata = [];
    downloaddata = [];
    showtable = false;
    pageSize = 25;
    pageNumber = 1;
    recordsToDisplay = [];
    size = 0;
    loaded = false;

    get regionOptions() {
        return [{ label: "South", value: "South" }, { label: "North", value: "North" }, { label: "West", value: "West" }, { label: "East", value: "East" }];
    }
    get segmentOptions() {
        return [{ label: "Processor", value: "Processor" }, { label: "Distribution", value: "Distribution" }];
    }
    get MonthValues() {
        return [{ label: "Jan", value: "Jan" }, { label: "Feb", value: "Feb" }, { label: "Mar", value: "Mar" }, { label: "Apr", value: "Apr" }, { label: "May", value: "May" }, { label: "Jun", value: "Jun" }, { label: "Jul", value: "Jul" }, { label: "Aug", value: "Aug" }, { label: "Sep", value: "Sep" }, { label: "Oct", value: "Oct" }, { label: "Nov", value: "Nov" }, { label: "Dec", value: "Dec" }];

    }
    get YearValues() {
        const currentyear = new Date().getFullYear();

        return [
            { label: currentyear - 3, value: String(currentyear - 3) },
            { label: currentyear - 2, value: String(currentyear - 2) },
            { label: currentyear - 1, value: String(currentyear - 1) },
            { label: currentyear,     value: String(currentyear) },
            { label: currentyear + 1, value: String(currentyear + 1) },
            { label: currentyear + 2, value: String(currentyear + 2) },
        ];
    }
    handleregionChange(event){
        this.region = event.target.value;
    }

    handlesegmentChange(event){
        this.segment = event.target.value;
    }
    handleyearChange(event){
        this.year = event.target.value;
    }
    handleMonthChange(event){
        this.month = event.target.value;
    }
    handelupload(){
       this.isfilter = true;
    }
    hideModalBox(){
        this.isfilter = false;
    }
    Done(){
        this.isfilter = false;
    }

    submit(){
        if(this.region == null || this.segment == null || this.month == null || this.year == null){
            this.error = 'Please select required field';
        }else{
         
         this.loaded = true;
        getinvoice({Type:this.segment,region:this.region,month:this.month,year:this.year})
         .then(result =>{
             this.data = result;
             if(this.data == ''){
                this.error = 'No Records Found';
                this.loaded = false;
                this.showtable = false;
            }else{
            this.showtable = true;
            
            this.size = result.length;
            this.mapdata = this.data.map(row =>{
                return {...row,ProductName:row.Product__r.Name,Agreed__Rate:''}
            })
            this.downloaddata = this.mapdata.filter(value => value.Agreed_Rate__c==null);

            console.log(JSON.stringify(this.downloaddata));
            this.paginationHelper();
            this.loaded = false;
            this.error = '';
            }
         })
         .catch(error =>{
            this.error = error;
            this.loaded = false;

         })
        }
    }
    uploadFileHandler(event) {

        const uploadedFiles = event.detail.files;
      
    
        csvFileRead({contentDocumentId : uploadedFiles[0].documentId})
        .then(result => {
            this.isfilter = false;
            window.console.log('result ===> '+result);
             
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success!!',
                    message: 'Invoice are Successfully Uploaded',
                    variant: 'Success',
                }),
            );
            
            
        })
        .catch(error => {

            this.error = error;    
        })
        
    }

    exportData(){
        let rowEnd = '\n';
            let csvString = '';
            // this set elminates the duplicates if have any duplicate keys
            let rowData = new Set();
    
            // getting keys from data
            this.downloaddata.forEach(function (record) {
                Object.keys(record).forEach(function (key) {
                    rowData.add(key);
                });
            });
    
            // Array.from() method returns an Array object from any object with a length property or an iterable object.
            rowData = Array.from(rowData);
            
            // splitting using ','
            csvString += rowData.join(',');
            csvString += rowEnd;
    
            // main for loop to get the data based on key value
            for(let i=0; i < this.downloaddata.length; i++){
                let colValue = 0;
    
                // validating keys in data
                for(let key in rowData) {
                    if(rowData.hasOwnProperty(key)) {
                        // Key value 
                        // Ex: Id, Name
                        let rowKey = rowData[key];
                        // add , after every value except the first.
                        if(colValue > 0){
                            csvString += ',';
                        }
                        // If the column is undefined, it as blank in the CSV file.
                        let value = this.downloaddata[i][rowKey] === undefined ? '' : this.downloaddata[i][rowKey];
                        csvString += '"'+ value +'"';
                        colValue++;
                    }
                }
                csvString += rowEnd;
            }
    
            // Creating anchor element to download
            let downloadElement = document.createElement('a');
    
            // This  encodeURI encodes special characters, except: , / ? : @ & = + $ # (Use encodeURIComponent() to encode these characters).
            downloadElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csvString);
            downloadElement.target = '_self';
            // CSV File Name
            downloadElement.download = 'Invoice.csv';
            // below statement is required if you are using firefox browser
            document.body.appendChild(downloadElement);
            // click() Javascript function to download CSV file
            downloadElement.click(); 
        }

        previousPage() {
            this.pageNumber = this.pageNumber - 1;
            this.paginationHelper();
        }
        nextPage() {
            this.pageNumber = this.pageNumber + 1;
            this.paginationHelper();
        }
    
        paginationHelper() {
            this.recordsToDisplay = [];
            // calculate total pages
            this.totalPages = Math.ceil(this.size /this.pageSize);
            // set page number 
            if (this.pageNumber <= 1) {
                this.pageNumber = 1;
            } else if (this.pageNumber >= this.totalPages) {
                this.pageNumber = this.totalPages;
            }
            // set records to display on current page 
            for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
                if (i === this.size) {
                    break;
                }
                    this.loaded = false;
                this.recordsToDisplay.push(this.mapdata[i]);
            }
        }
}
