'use strict';

/**
 * navbar toggle
 */

const overlay = document.querySelector("[data-overlay]");
const navbar = document.querySelector("[data-navbar]");
const navToggleBtn = document.querySelector("[data-nav-toggle-btn]");
const navbarLinks = document.querySelectorAll("[data-nav-link]");
const inputDate = document.getElementById('input-5');
const now = new Date();
const year = now.getFullYear().toString();
const month = (now.getMonth() + 1).toString().padStart(2, '0');
const day = now.getDate().toString().padStart(2, '0');
let pickupCoords = {};
let dropCoords = {};
let roundTripValue = 'No';
let prevRoundTripValue = '';
let formattedPickupTime='';
let formattedDate='';
let formattedReturnDate='';
let distance =0;
let apprFare;
let pickupPointValue='';
let dropPointValue='';
let cabTypeValue='';
inputDate.min = ` ₹{year}- ₹{month}- ₹{day}`;
const navToggleFunc = function () {
  navToggleBtn.classList.toggle("active");
  navbar.classList.toggle("active");
  overlay.classList.toggle("active");
}
const taxiDetails={ "sedan" : {"fare":14, "description":"Sedan(Etios, Dzire etc) - Rs.14/km"},
                    "suv" : {"fare":19, "description":"SUV(Marazzo, Ertiga etc) - Rs.19/km"}, 
                    "crysta" : {"fare":22, "description":"Innova Crysta(Rs.22/km)"}
                    };
const mobileNumInput = document.getElementById('input-2');
const dateInput = document.getElementById('input-5');
const timeInput = document.getElementById('input-6');
const timeError = document.getElementById('time-error');
const bounds = "11.1271,78.6569"; // Southwest|Northeast
const radius = 700000;
const returnDateInput = document.getElementById('return-date');
const returnDateElement = document.getElementById('return-date-element');    
returnDateElement.style.display = 'none';
let ipAddress="";
async function getIpAddressAndConstructMessage() {
  try {
    const response = await fetch("https://checkip.amazonaws.com/");
     ipAddress = await response.text();
      console.log(ipAddress);
  } catch (error) {
    console.error("Error fetching IP address:", error);
    // Handle the error, e.g., display an error message to the user
  }
}
getIpAddressAndConstructMessage();

function validateTime() {
    const today = new Date();
    today.setMinutes(today.getMinutes() + 30);
    const selectedDate = new Date(dateInput.value);
    const currentTime = today.toTimeString().split(":").slice(0, 2).join(":");

    // If date is today, restrict the time to be after the current time
    if (selectedDate.toDateString() === today.toDateString()) {
      if (timeInput.value && timeInput.value <= currentTime) {
        timeInput.setCustomValidity('Please choose the time atleast 30 mins from now or later');
      } else {
        timeInput.setCustomValidity('');
      }
    } else {
      timeInput.setCustomValidity('');
    }
}

function validateMobileNum() {
      if (/^[0-6]/.test(mobileNumInput.value.trim())) {
        mobileNumInput.setCustomValidity('Please enter valid mobile number');
      } else {
        mobileNumInput.setCustomValidity('');
      }
}
function validateReturnDate(){
  
  const returnDate = new Date(returnDateInput.value);
  const pickupDate = new Date(dateInput.value);
  if (returnDate < pickupDate) {
    returnDateInput.setCustomValidity("Drop date cannot be before or same as pickup date");
  } else {
    returnDateInput.setCustomValidity(""); 
  }
}

// Listen for changes in date and time fields
dateInput.addEventListener('change', ()=>{validateTime();validateReturnDate();});
timeInput.addEventListener('change', validateTime);
mobileNumInput.addEventListener('change', validateMobileNum);
returnDateInput.addEventListener('change', validateReturnDate);



navToggleBtn.addEventListener("click", navToggleFunc);
overlay.addEventListener("click", navToggleFunc);

for (let i = 0; i < navbarLinks.length; i++) {
  navbarLinks[i].addEventListener("click", navToggleFunc);
}



/**
 * header active on scroll
 */

const header = document.querySelector("[data-header]");

window.addEventListener("scroll", function () {
  window.scrollY >= 10 ? header.classList.add("active")
    : header.classList.remove("active");
});
function calculateDistance(){
    let pickupPoint = document.getElementById("pickup-point").value;
    let dropPoint = document.getElementById("drop-point").value;
    let cabType = document.getElementById("input-7").value;
    if((!pickupPoint||!dropPoint ||!cabType || document.getElementById("pickup-point").validationMessage!=""|| document.getElementById("drop-point").validationMessage!="")){
        document.getElementById("appr-fare").classList.add("hidden");
        return;
    }
    
    if((pickupPointValue==pickupPoint && dropPointValue==dropPoint && cabType==cabTypeValue && roundTripValue==prevRoundTripValue)){
        if(validateDropPoint()==false){
            document.getElementById("appr-fare").classList.add("hidden");
            return;
        }
    }
    pickupPointValue = document.getElementById("pickup-point").value;
    dropPointValue = document.getElementById("drop-point").value;
    prevRoundTripValue = roundTripValue;
    cabTypeValue = cabType;
    getDistanceBetweenPoints(pickupCoords, dropCoords, (sucess)=> {   
        if(sucess != false && validateDropPoint()!=false){
            calculateFare();    
        }
        
    });
}
function validateDropPoint(){
    const dropInput = document.getElementById("drop-point");
    const currentValidityMessage = dropInput.validationMessage;
    console.log(currentValidityMessage);
    if(roundTripValue!="Yes" && distance < 50){
        if(currentValidityMessage!="Single trip must be at least 50 km"){
            dropInput.setCustomValidity("Single trip must be at least 50 km");
            dropInput.reportValidity();
            document.getElementById("appr-fare").classList.add("hidden");
        }
        return false;
    }
    if(roundTripValue=="Yes" && distance < 50){
        if(currentValidityMessage!="Round trip must be at least 100 km"){
            dropInput.setCustomValidity("Round trip must be at least 100 km");
            dropInput.reportValidity();
            document.getElementById("appr-fare").classList.add("hidden");
        }
        return false;
    }
    dropInput.setCustomValidity("");
    return true;
}
function calculateFare(){
    let cabType = document.getElementById('input-7').value;
        if(!cabType){
            return;
        }
        let ratePerKm;

        switch (cabType) {
            case 'Sedan(Etios, Dzire etc) - Rs.14/km':
                ratePerKm = 14;
                break;
            case 'SUV(Marazzo, Ertiga etc) - Rs.19/km':
                ratePerKm = 19;
                break;
            case 'Innova Crysta(Rs.22/km)':
                ratePerKm = 22;
                break;
            default:
                console.log('Unknown car type selected');
                return 0; // Return 0 if the car type is not recognized
        }
        let driverBetta = distance>400?500:300;
        let minimumDistance;
        document.getElementById("minimum_distance").innerText = ""; 
        if(roundTripValue=="Yes"){
            ratePerKm = ratePerKm-1;
            distance = distance*2;
            if(distance<250){
                minimumDistance = 250; 
                document.getElementById("minimum_distance").textContent = "Minimum distance 250 Km";
                document.getElementById("minimum_distance").appendChild(document.createElement("br"));
            } else {
               minimumDistance = distance;
            }
        } else {
            if(distance<130){
                minimumDistance = 130;
                document.getElementById("minimum_distance").textContent = "Minimum distance 130 Km"; 
                document.getElementById("minimum_distance").appendChild(document.createElement("br"));
            } else {
               minimumDistance = distance;
            }
        }
        let totalfare = (minimumDistance * ratePerKm)+driverBetta;
        apprFare = "Rs."+ Math.round(totalfare)+"/-";
        
        document.getElementById("appr-fare").classList.remove("hidden");
        document.getElementById("appro_fare").innerText = apprFare;
        document.getElementById("total_km").innerText = distance+" km";
        document.getElementById("charges_km").innerText = "Rs."+ratePerKm+"/-"; 
        document.getElementById("driver_betta").innerText = "Rs."+driverBetta+"/-";
}
 function showSuccessMessage() {
    document.querySelector('.input-wrapper-success').style.display = 'flex';
    document.getElementById('customer_name').innerText = document.getElementById('input-1').value;
    document.getElementById('customer_pickup_loc').innerText = document.getElementById('pickup-point').value;
    document.getElementById('customer_drop_loc').innerText = document.getElementById('drop-point').value;
    document.getElementById('customer_pickup_time').innerText = formattedDate+" "+formattedPickupTime;
    document.getElementById('customer_return_date').innerText = roundTripValue=='Yes'?formattedReturnDate:'-';
    document.getElementById('customer_number').innerText = document.getElementById('input-2').value;
    document.getElementById('cab_type').innerText = document.getElementById('input-7').value;
    document.getElementById('round_trip').innerText = roundTripValue;
    document.getElementById('distance').innerText = distance+" km";
    document.getElementById('fare').innerText = apprFare?apprFare:"-";
}
function constructGoogleMapsLink(lat, lng) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

//emailjs.init('fKdTn44q0lXV5IXY4');
function sendEmail(thisObj){
  /*emailjs.sendForm('service_x5onnnv', 'template_wn5q4ha', thisObj)
        .then(function (response) {
            console.log('SUCCESS!', response.status, response.text);
            showSuccessMessage();
        }, function (error) {
            console.log('FAILED...', error);
            alert('Error sending email. Please try again later.');
        });*/
}
function formateDate(date){
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
}
function convertTo12HourFormat(time) {
    if(!time)return;
    let [hours, minutes] = time.split(':');
    let period = 'AM';

    hours = parseInt(hours);

    if (hours >= 12) {
        period = 'PM';
        if (hours > 12) hours -= 12;
    } else if (hours === 0) {
        hours = 12; // Midnight edge case
    }

    return `${hours}:${minutes} ${period}`;
}


function getDistanceBetweenPoints(pickupCoords, dropCoords, callback) {
    const url = `https://api.olamaps.io/routing/v1/distanceMatrix?origins=${pickupCoords.lat},${pickupCoords.lng}&destinations=${dropCoords.lat},${dropCoords.lng}&mode=driving&api_key=${apiKey}`;
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.rows && data.rows.length > 0 && data.rows[0] && data.rows[0].elements && data.rows[0].elements.length > 0) {
                distance = data.rows[0].elements[0].distance; // distance in meters
                distance = distance?distance/1000:0;
                if (distance % 1 === 0) {
                    distance = distance.toFixed(0); // No decimal places
                } else {
                    distance = distance.toFixed(1); // One decimal place
                }
                callback(); // Convert to kilometers
            } else {
                console.error('No routes found');
                callback(false);
            }
        })
        .catch(error => {
            console.error('Error fetching distance:', error);
            callback(false);
        });
}

function sendTelegramMsg(){
    const customerName = document.getElementById('customer_name').innerText;
    const customerPickupLoc = document.getElementById('customer_pickup_loc').innerText;
    const customerDropLoc = document.getElementById('customer_drop_loc').innerText;
    const customerNumber = document.getElementById('customer_number').innerText;
    const pickupMapLink = constructGoogleMapsLink(pickupCoords.lat, pickupCoords.lng);
    const dropMapLink = constructGoogleMapsLink(dropCoords.lat, dropCoords.lng);
    const pickupTime = document.getElementById('customer_pickup_time').innerText;
    const returnDate = roundTripValue=='Yes'?document.getElementById('customer_return_date').innerText:'-';
    const cabType = document.getElementById('cab_type').innerText;
    const fare = document.getElementById('fare').innerText;
    const driverbetta = document.getElementById("driver_betta").innerText
    
        const messageText = `
Dear Customer,
Thank you for booking Taxi through Family Droptaxi. Here are the details:

Customer Name: ${customerName}  
Contact Number: ${customerNumber}
Ip Address: ${ipAddress}

Pickup Location: ${customerPickupLoc}  
Pickup Link: ${pickupMapLink}  

Drop Location: ${customerDropLoc}
Drop Link: ${dropMapLink}
            
Round Trip: ${roundTripValue}
Pickup Date/Time: ${pickupTime}  
Return Date: ${returnDate}  
Cab Type: ${cabType}
Total Distance: ${distance} KM  
Driver Betta: ${driverbetta}
Fare Estimation: ${fare}
Toll, Permit, Hill-station, Luggage carrier, waiting and Parking Charges Extra if applicable

Thank you!
Best regards,
**Family Droptaxi**
https://familydroptaxi.in
        `;

        // URL encode the message
        const urlEncodedMessage = encodeURIComponent(messageText);


        console.log(messageText);
        // Construct the URL for the Telegram API request
        const url = `https://api.telegram.org/bot6577358669:AAHaR6p_uZ0sGDRwuxS0YKqyg-BVSpZPcZI/sendMessage?chat_id=-4231118038&text=${urlEncodedMessage}&&disable_web_page_preview=true&parse_mode=Markdown`;
        console.log(url);
        fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.ok) {
                console.log('Message sent successfully:', data);
            } else {
                console.error('Error sending message:', data);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
           
}
document.getElementById('hero-form').addEventListener('submit', function (event) {   
    event.preventDefault(); // Prevent form submission
    let text = `Due to heavy traffic and demand, fares will be adjusted as follows: 
    * Sedan (Etios, Dzire, Etc): Rs.16/KM
    * SUV (Marazzo, Ertiga, Etc): Rs.21/KM
    * Innova Crysta: Rs.25/KM

    Proceed to book your Taxi?`;
      if (confirm(text) != true) {
        return;
      }
    formattedPickupTime = convertTo12HourFormat(document.getElementById("input-6").value);
    formattedDate = formateDate(document.getElementById("input-5").value);
    formattedReturnDate = formateDate(document.getElementById("return-date").value);
    console.log(this);
    showSuccessMessage();        
    sendEmail(this);
    sendTelegramMsg();
    roundTripValue = 'No';
    document.getElementById("appr-fare").classList.add("hidden");
    this.reset();
     
});

    
const apiKey = 'CvBHxlan7n1vSlyPb4yJrb3DL0aSACdZotfvRdye';
// Handle input for both pickup point and drop point to trigger API call
$('.t-dropdown-input').on('input', function() {
    const dropdownList = $(this).next('.t-dropdown-list');
    const query = $(this).val().trim();
    const elementId = $(this).attr('id');
    // Check which input is being used
    if (elementId === 'pickup-point' || elementId === 'drop-point') {
        console.log("Input detected for:", elementId);
        
        if (query.length > 1) {
            // Call the appropriate fetch function based on the input
            if (elementId === 'pickup-point') {
                    debouncedFetchPickupSuggestions(query); // Use debounced functio
            } else if (elementId === 'drop-point') {
                $('#' + elementId)[0].setCustomValidity('');
                debouncedFetchDropSuggestions(query);
            }
        } else {
            // Hide dropdown and add empty class to hide border
            dropdownList.slideUp('fast').addClass('empty');
        }
    }
});
// Debounce function to limit the rate of function execution
function debounce(fn, delay) {
    let timeoutID;
    return function(...args) {
        if (timeoutID) {
            clearTimeout(timeoutID); // Clear the previous timeout if the function is called again
        }
        timeoutID = setTimeout(() => {
            fn.apply(this, args); // Execute the function after the delay
        }, delay);
    };
}
const debouncedFetchPickupSuggestions = debounce(function(query) {
    fetchPickupSuggestions(query);
}, 300); // 300ms delay

// Debounced version of the API call for drop point
const debouncedFetchDropSuggestions = debounce(function(query) {
    fetchDropSuggestions(query);
}, 300); // 300ms delay

// Fetch suggestions for pickup point
function fetchPickupSuggestions(query) {
    fetch(`https://api.olamaps.io/places/v1/autocomplete?input=${query}&api_key=${apiKey}&location=${bounds}&radius=${radius}&strictbounds=true`)
        .then(response => response.json())
        .then(data => {
            if (data.status === "ok") {
                let dropPointValue = $('#drop-point').val().trim();
                updateDropdown($('#pickup-dropdown-list'), data.predictions, dropPointValue, 'pickup');
            }
        })
        .catch(error => {
            console.error('Error fetching pickup point suggestions:', error);
        });
}

// Fetch suggestions for drop point (dummy URL for example)
function fetchDropSuggestions(query) {
    
    fetch(`https://api.olamaps.io/places/v1/autocomplete?input=${query}&api_key=${apiKey}&location=${bounds}&radius=${radius}&strictbounds=true`) // Update with actual endpoint if different
        .then(response => response.json())
        .then(data => {
            if (data.status === "ok") {
                let pickupPointValue = $('#pickup-point').val().trim(); // Get the current value of pickup point

                updateDropdown($('#drop-dropdown-list'), data.predictions, pickupPointValue,'drop');
            }
        })
        .catch(error => {
            console.error('Error fetching drop point suggestions:', error);
        });
}

// Update the dropdown list with suggestions
function updateDropdown(dropdownList, predictions, otherFieldValue, fieldType) {
    dropdownList.empty(); // Clear the existing list

    if (predictions.length > 0) {
        predictions.forEach(prediction => {
            if (prediction.description !== otherFieldValue) {
                const listItem = $('<li class="t-dropdown-item"></li>').text(prediction.description);
                dropdownList.append(listItem);
                // Store the coordinates based on the field type
                listItem.on('click', function() {
                    if (fieldType === 'pickup') {
                        document.getElementById("pickup-point").setCustomValidity("");
                        pickupCoords = {
                            lat: prediction.geometry.location.lat,
                            lng: prediction.geometry.location.lng
                        };
                    } else if (fieldType === 'drop') {
                        document.getElementById("drop-point").setCustomValidity("");
                        dropCoords = {
                            lat: prediction.geometry.location.lat,
                            lng: prediction.geometry.location.lng
                        };
                    }
                });
                listItem.data('lat', prediction.geometry.location.lat);
                listItem.data('lng', prediction.geometry.location.lng);
            }
        });
        dropdownList.removeClass('empty'); // Remove empty class to show border
        dropdownList.slideDown('fast', function() {
            $(this).css('display', 'block'); // Ensures the display is set to block
        });
    } else {
        if (fieldType === 'pickup') {                    
            document.getElementById("pickup-point").setCustomValidity("Location not found");
            document.getElementById("pickup-point").reportValidity();
            document.getElementById("appr-fare").classList.add("hidden");
        } else if(fieldType === 'drop'){
            document.getElementById("drop-point").setCustomValidity("Location not found");
            document.getElementById("drop-point").reportValidity();
            document.getElementById("appr-fare").classList.add("hidden");
        }
        dropdownList.addClass('empty'); // Add empty class if no predictions
        dropdownList.slideUp('fast'); // Hide if no results
    }
}

// Handle dropdown visibility for the clicked input
$('.t-dropdown-input').on('click', function() {
    const dropdownList = $(this).next('.t-dropdown-list');

    // Close any other open dropdowns before opening the current one
    $('.t-dropdown-list').not(dropdownList).slideUp('fast');
   // Check if it's the pickup or drop point input
    if ($(this).attr('id') === 'pickup-point' || $(this).attr('id') === 'drop-point') {
        // If the dropdown is empty, add the 'empty' class
        if (dropdownList.children('li').length === 0) {
            dropdownList.addClass('empty');
        } else {
            dropdownList.removeClass('empty');
        }
    }
    // Toggle the current dropdown
    dropdownList.slideToggle('fast');
});

// Handle dropdown item selection
$('.t-dropdown-list').on('click', 'li.t-dropdown-item', function() {
    const selectedText = $(this).text();
    const dropdownInput = $(this).closest('.input-wrapper').find('.t-dropdown-input');
    dropdownInput.val(selectedText);
   if (dropdownInput.attr('id') === 'pickup-point' || dropdownInput.attr('id') === 'drop-point') {
        calculateDistance();    
        dropdownInput.next('.t-dropdown-list').slideUp('fast').empty(); // Clear the list
    } else {
        dropdownInput.next('.t-dropdown-list').slideUp('fast'); // Just close for other inputs
    }
    calculateDistance();
});

// Close dropdown if clicked outside
$(document).on('click', function(event) {
    if (!$(event.target).closest('.t-dropdown-input, .t-dropdown-list').length) {
        // Close and clear both dropdowns if clicked outside
        $('#pickup-dropdown-list').slideUp('fast').empty();
        $('#drop-dropdown-list').slideUp('fast').empty();
        const dropInput = document.getElementById("drop-point");
       
        $('#t-dropdown-list').slideUp('fast');
    }
});

// Set dynamic width for the dropdown list
$('.t-dropdown-list').width($('.t-dropdown-input').width());

// Clear the input field
$('.t-dropdown-input').val('');
    
    //dropdown selecrted by key down and enter
    let currentIndex = -1; // Tracks the index of the currently highlighted item
    
$('.t-dropdown-input').on('keydown', function(event) {
    const dropdownList = $(this).next('.t-dropdown-list');
    const items = dropdownList.find('li.t-dropdown-item');

    if (dropdownList.is(':visible')) {
        if (event.key === 'ArrowDown') {
            // Move down in the list
            event.preventDefault();
            currentIndex++;
            if (currentIndex >= items.length) currentIndex = 0;
            highlightItem(items, currentIndex);
        } else if (event.key === 'ArrowUp') {
            // Move up in the list
            event.preventDefault();
            currentIndex--;
            if (currentIndex < 0) currentIndex = items.length - 1;
            highlightItem(items, currentIndex);
        } else if (event.key === 'Enter') {
             
            // Select the highlighted item
            event.preventDefault();
            if (currentIndex >= 0) {
                const selectedItem = items.eq(currentIndex);
                if($(this).attr('id')==="pickup-point"){
                    pickupCoords = {
                        lat: selectedItem.data('lat'),
                        lng: selectedItem.data('lng')
                    };
                }else if($(this).attr('id')==="drop-point"){
                    dropCoords = {
                        lat: selectedItem.data('lat'),
                        lng: selectedItem.data('lng')
                    };    
                }  
                calculateDistance();
                console.log(pickupCoords);
                console.log(dropCoords);
                
                $(this).val(selectedItem.text()); // Set the input value    
                dropdownList.slideUp('fast'); // Close the dropdown
            }
        }
    }
});
function highlightItem(items, index) {
    items.removeClass('highlight'); // Remove highlight from all items
    items.eq(index).addClass('highlight'); // Highlight the current item
}

// END //
  /*  
 var autocomplete;
 autocomplete = new google.maps.places.Autocomplete((document.getElementById('input-3')), {
  types: ['geocode'],
  componentRestrictions: {
   country: "IN"
  }
 });
  
 google.maps.event.addListener(autocomplete, 'place_changed', function () {
  document.getElementById('input-3').value = autocomplete.getPlace();
 });

    var autocomplete_drop;
 autocomplete = new google.maps.places.Autocomplete((document.getElementById('input-4')), {
  types: ['geocode'],
  //componentRestrictions: {
   //country: "USA"
  //}
 });
  
 google.maps.event.addListener(autocomplete_drop, 'place_changed', function () {
  document.getElementById('input-4').value = autocomplete.getPlace();
 });
*/


function populate(carType){
  if(!carType)return;
  $('.cartype').val(carType);  
   $('html, body').animate({
        scrollTop: $('.t-dropdown-input').offset().top
    }, 1, function() {
        $('.t-dropdown-input').focus();
    });
}
const inputField = document.getElementById('input-2');

inputField.addEventListener('input', () => {
  // Remove non-numeric characters
  inputField.value = inputField.value.replace(/[^0-9]/g, '');

  // Limit input length to maxLength
  inputField.value = inputField.value.slice(0, inputField.maxLength);

  // Validate minLength
  if (inputField.value.length < inputField.minLength) {
    inputField.setCustomValidity('Mobile number must be 10 digits.');
  } else {
    inputField.setCustomValidity(''); 
  }
});

document.getElementById('round-trip').addEventListener('change', function() {
    roundTripValue = this.checked ? 'Yes' : 'No';
    returnDateElement.style.display = this.checked ? 'block':'none'; 
    document.getElementById("drop-point").  setCustomValidity("");
    calculateDistance();
    console.log('Round Trip:', roundTripValue);
});
