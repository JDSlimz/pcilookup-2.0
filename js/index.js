var SUPABASE_URL = 'https://uuebcjnegkkctpvxsbva.supabase.co'
var SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1ZWJjam5lZ2trY3RwdnhzYnZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDY3MDM3ODAsImV4cCI6MTk2MjI3OTc4MH0.05MqGrgEyrDu1m9HGQMUMrJolzRnyEhJiJgDCjCw8Co'
const options = {
    schema: 'public',
    //headers: { 'x-my-custom-header': 'simply-memes' },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
}
var supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, options);

let vendors = [];
let devices = [];
const columnDefs = [
    { headerName: 'Vendor ID', field: "venID", flex: 1 },
    { headerName: 'Vendor', field: "venDesc", flex: 3 },
    { headerName: 'Device ID', field: "id", flex: 1 },
    { headerName: 'Device', field: "desc", flex: 3 },
    { headerName: 'Download', field: "fileID", flex: 1 }
];

$( document ).ready(async function() {
    const autoCompleteJSDev = new autoComplete({ 
        selector: "#dev",
        placeHolder: "e.g. 010b or 1080 TI",
        data: {
            src: []
        },
        resultItem: {
            highlight: true,
        },
        events: {
            input: {
                selection: (event) => {
                    const selection = event.detail.selection.value;
                    autoCompleteJSDev.input.value = selection;
                }
            }
        }
     });

    const autoCompleteJSVen = new autoComplete({ 
        selector: "#ven",
        placeHolder: "e.g. 10de or Nvidia",
        data: {
            src: vendors
        },
        resultItem: {
            highlight: true,
        },
        events: {
            input: {
                selection: async (event) => {
                    const selection = event.detail.selection.value;
                    autoCompleteJSVen.input.value = selection.split(' - ')[0];
                    populateDevicesInput(selection.split(' - ')[0]);
                }
            }
        }
    });
     
    await getAllVendors();

    //Initialize table
    const gridDiv = document.querySelector('#resultsTable');
});

function findDevices(deviceQuery = "", vendorQuery = ""){  
    return new Promise(async (resolve, reject) => {  
      await supabase
      .from('device_view')
      .select()
      .or('id.ilike.%' + deviceQuery + '%, desc.ilike.%' + deviceQuery + '%')
      .or('venID.ilike.%' + vendorQuery + '%, venDesc.ilike.%' + vendorQuery + '%')
      .then((deviceData,deviceError) => {
        if(deviceError){
          console.log("Error:", deviceError);
          reject(deviceError);
        } else {
          console.log("Data:", deviceData);
          resolve(deviceData);
        }
      });
    });
  }
  
  function getAllVendors(){
    return new Promise(async (resolve, reject) => {
      await supabase
      .from('vendors')
      .select('id, desc', { count: 'exact' })
      .then((deviceData,deviceError) => {
        if(deviceError){
          console.log("Error:", deviceError);
          reject(deviceError);
        } else {
            deviceData.data.forEach(vendor => {
                vendors.push(vendor.id + " - " + vendor.desc)
            });
          resolve(vendors);
        }
      });
    });
  }
  
  function getDevicesByVendorId(vendorId) {
    return new Promise(async (resolve, reject) => {
      await supabase
      .from('device_view')
      .select('id, desc')
      .eq('venID', vendorId)
      .then((deviceData,deviceError) => {
        if(deviceError){
          console.log("Error:", deviceError);
          reject(deviceError);
        } else {
            devices = [];
            deviceData.data.forEach(device => {
                devices.push(device.id + " - " + device.desc)
            });
          resolve(devices);
        }
      });
    });
  }

  async function populateDevicesInput(vendorId){
    await getDevicesByVendorId(vendorId);
    const autoCompleteJSDev = new autoComplete({ 
        selector: "#dev",
        placeHolder: "e.g. 010b or 1080 TI",
        data: {
            src: devices
        },
        resultItem: {
            highlight: true,
        },
        events: {
            input: {
                selection: (event) => {
                    const selection = event.detail.selection.value;
                    autoCompleteJSDev.input.value = selection.split(' - ')[0];
                }
            }
        }
     });
  }

async function search(){
    const vendorSearch = $('#ven').val();
    const deviceSearch = $('#dev').val();
    const devices = await findDevices(deviceSearch, vendorSearch);
    console.log(devices.data);

    makeAndShowTable(devices.data);
}

async function listAll(){
    const devices = await findDevices();
    console.log(devices.data);

    makeAndShowTable(devices.data);
}

function makeAndShowTable(devices){
  document.getElementById("resultsTable").innerHTML = "";
  const grid = new gridjs.Grid({
    columns: [{
      id: 'id',
      name: 'Dev ID'
   }, {
      id: 'desc',
      name: 'Device'
   }, {
      id: 'venID',
      name: 'Ven ID'
   }, {
    id: 'venDesc',
    name: 'Vendor'
 }],
    pagination: true,
    sort: true,
    data: devices
  }).render(document.getElementById("resultsTable"));
};