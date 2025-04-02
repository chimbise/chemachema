import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection,Timestamp, setDoc ,doc,getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCVeRF7CM52jidngi4AmMJJ6dnOMhgAxko",
  authDomain: "calc-c6b1c.firebaseapp.com",
  projectId: "calc-c6b1c",
  storageBucket: "calc-c6b1c.firebasestorage.app",
  messagingSenderId: "751714875802",
  appId: "1:751714875802:web:9ffa30b7ee66579c686223",
  measurementId: "G-L3XCXKVY8R"
};


var select = document.getElementById("loanTermDropdown");

// Define the loan terms in months
var loanTerms = Array.from({ length: 120 - 6 + 1 }, (_, i) => 120 - i);
// Loop through the array and create option elements
loanTerms.forEach(term => {
    var option = document.createElement("option");
    option.value = term;
    option.textContent = `${term} months`;
    select.appendChild(option);
});


// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const auth = getAuth(app);
const db = getFirestore(); // Firestore reference
const usersRef = collection(db, "registered_users"); // Reference to collection

var phoneNumber = "06";

let lastOTPTime;

function canRequestOTP(localTime) {

        const currentTime = Timestamp.now();

        // Convert Firestore Timestamps to JavaScript Date objects
        
        
        //const lastOTPDate = lastOTPTime.toDate();
        const currentDate = currentTime.toDate();
        //console.log(lastOTPDate)
        

        const localTimeDate = localTime.toDate();

        const hoursPassed = (currentDate - localTimeDate)/3600000 ; // Convert ms to hours

        if (hoursPassed < 3) {
          return true;
        } else{  //3.75 minutes
            //showNotification(`OTP already sent. Try again in ${Math.ceil(0.0625 - hoursPassed)} hours.`);
            return false; //allow OTP request
        }

  //return true; // Allow sendOTP() to run
}

let pass;
let idx;
let sub;
function sendOTP() {
  if (phoneNumber.length !== 8) {
    phoneNumber = document.getElementById("phoneNumber").value;
  }
  const phoneQuery = query(usersRef, where("phoneNumber", "==", phoneNumber)); 
  getDocs(phoneQuery)
      .then((querySnapshot) => {
          if (querySnapshot.empty) {
              showNotification("Entered number is not registered, call/whatsapp 78282260 for registration")
              sendOTPButton.disabled = false;
              //window.location.reload();
              return;
          }else{
            querySnapshot.forEach((doc) => {
              pass = doc.data().password || "12345"// Get the password field
              lastOTPTime = doc.data().createdAt || Timestamp.fromDate(new Date(0)); // Default to old date if missing
              idx = doc.id;
              var c = canRequestOTP(lastOTPTime)
              sub = doc.data().sub

              if (c) {
                showNotification("you are currently logged on another device!")
                //window.location.reload();
                return;
                } 
              
              if (sub === "false") {
                showNotification("your subscription is exired, call/whatsapp 78282260 for renewal")
                //window.location.reload();
              }else{
                document.getElementById("otpSection1").style.display = "none";
                document.getElementById("otpSection").style.display = "flex";
              }
            });
          }
      })
      .catch((error) => {
        showNotification(error.message);
        console.log(error.message)
        sendOTPButton.disabled = false;
      }); 
}

 // Check locally stored OTP request time

 var b = localStorage.getItem("lastOTPTime");

 let lastOTPDateLocal; //= lastOTPLocal ? lastOTPLocal.toDate() : new Date(0);

 // Extract numbers using regex
 let match;

 if (b) {

  match = b.match(/seconds=(\d+), nanoseconds=(\d+)/);
  const seconds = parseInt(match[1], 10);
  const nanoseconds = parseInt(match[2], 10);

  // Create Firestore Timestamp
  var lastOTPDateLocallll = new Timestamp(seconds, nanoseconds);
  lastOTPDateLocal = lastOTPDateLocallll   //.toDate()

  var x = canRequestOTP(lastOTPDateLocal);
  if (x) {
    document.getElementById("login").style.display = "none";
  } 
 }


var sendOTPButton = document.getElementById("sendOTP")
sendOTPButton.addEventListener("click",(e)=>{
  sendOTP()
})
var registerButton = document.getElementById("register")
registerButton.addEventListener("click",(e)=>{
  showNotification('Call/whatsapp 78282260 for registration')
})
function showNotification(text) {
  const notification = document.getElementById('notification');
  notification.textContent = text;
      notification.classList.add('show');
  // Hide the notification after 3 seconds
  setTimeout(() => {
      notification.classList.remove('show');
  }, 5000);
}
var verifyOTPButton = document.getElementById("verifyOTP")
verifyOTPButton.addEventListener("click",(e)=>{
  verifyOTP()
})
  function verifyOTP() {
    //check password
    const otpCode = document.getElementById("otpCode").value;
    if (otpCode === pass&& pass === "12345"){
      document.getElementById("iform").style.display = "block";
    } else if (otpCode === pass && pass !== "12345") {
      document.getElementById("login").style.display = "none";
      recordTime()
    } else{
      showNotification("incorrect passsword")
    }
  }
async  function recordTime() {
    try {
      // Reference the document by ID
      const userRef = doc(db, "registered_users", idx);          
      // Get the document
      const userSnap = await getDoc(userRef); 
      var timenow = Timestamp.now(); 
      if (userSnap.exists()) {
          await setDoc(userRef, { 
            createdAt:timenow
        }, { merge: true });
      }
      localStorage.setItem("lastOTPTime", timenow);
      } catch (error) {
      console.error("Error resetting password: ", error);
  }
  }
  const input = document.getElementById("digitInput");
  const button = document.getElementById("submitBtn");

  input.addEventListener("input", () => {
      // Enable button only when exactly 5 digits are entered
      button.disabled = input.value.length !== 5 || isNaN(input.value);
  });

  document.getElementById("digitForm").addEventListener("submit", function(event) {
      event.preventDefault();

    resetPassword(idx,input.value)
  });

  async function resetPassword(userId, newPassword) {
      try {
          // Reference the document by ID
          const userRef = doc(db, "registered_users", userId);          
          // Get the document
          const userSnap = await getDoc(userRef);  
          if (userSnap.exists()) {
              // Update the password field
              await setDoc(userRef, { 
                password: newPassword,
                createdAt:new Timestamp(Timestamp.now().seconds - 3 * 60 * 60, Timestamp.now().nanoseconds),
                sub: "true"
            }, { merge: true });
              document.getElementById("iform").style.display = "none";
              pass = newPassword;
              showNotification("Password reset successfully!");

          } else {
              showNotification("User not found!");
          }
      } catch (error) {
          console.error("Error resetting password: ", error);
      }
  }  




 // Primary variables
 var rt = 0.20; // Annual interest rate for 20%
 //var c5 = rt / 12; // Monthly interest rate for 23%
 var b6 = rt / 12;// Monthly interest for 23%
 var term = 120; // Loan term for 96 months
 var b8 = 1.15; // Insurance
 var b9 = 0.0271; // Collections fee
 var c9 = 1 - b9; // Adjusted factor for collections fee
 var b10 = 1500; // Take-home married
 var b11 = 1300; // Take-home single
 var b12 = 600; // A3 to B1 pay scale
 var loanMax = 900000;
 
 //secondary variables
 var d14 = 0; // d14 is ag14
 var e14 = 0; // e14 is ah14
 var f14 = 0; // Calculate f14
 var g14 = 0; // Calculate g14
 var h14 = 0; // Calculate h14
 var j14 = 0; // Calculate j14
 var i14 = 0; // Calculate i14
 var l14 = 0;
 
 // Create loan amount column
 var startLoanAmount = 5000;
 var increment = 500;
 var maxLoanAmount = 900000;
 var loanAmountColumn = {}; // Loan amount column
 var loans = [];
 var keyIndex = 14;
 
 // Loop to populate the loan amount column
 for (var loanAmount = startLoanAmount; loanAmount <= maxLoanAmount; loanAmount += increment) {
     loans.push(loanAmount)
     var ckey = loanAmount.toString();
     loanAmountColumn[ckey] = loanAmount;
     keyIndex++;
 }
 
 function updateMonthlyAmountDisplay(value) {
   loanAmountSlider.style.color = 'black'
   monthlyPayDiv.value = totalMonthlyAmountDisplay(value);
 }
 var monthlyPayDiv = document.getElementById('loanAmountMonthlySlider');

 monthlyPayDiv.addEventListener('input', function() {
 
   var number = monthlyPayDiv.value;
  
   if (number < 158.10 ||number > totalMonthlyAmountDisplay(loanMax)) {
     //monthlyPayDiv.style.color = 'red'
     number = number.slice(0, 7); // Truncate to 6 digits
     monthlyPayDiv.value = number;
     loanAmountSlider.value = "";
     return null;
   }  
   var result = findClosestKey(number);
   showH3()
   totalMonthlyAmountDisplay(result[1]);
 });

 monthlyPayDiv.addEventListener('blur', function() {
 
   hideH3()
   monthlyPayDiv.value = totalMonthlyAmountDisplay(loanAmountSlider.value)
 });
 
 // Function to calculate PMT
 function PMT(rate, nper, pv) {
     if (rate === 0) {
         return -(pv / nper); // If rate is 0, just return the principal divided by the number of periods
     } else {
         var pvif = Math.pow(1 + rate, nper);
         var pmt = pv * rate * pvif / (pvif - 1);
         return -pmt; // Negate the result to match the Excel PMT function behavior
     }
 }

 function checkValueAg(AE14) {
   if (AE14 < 1120) {
       return 1120;
   } else if (AE14 >= 2878.4) {
     return 2878.4;
   }else{
       return AE14;
   }
 }
 
 // function checkValueAg2(AE14) {
 //   if (AE14 >= 2878.4) {
 //       return 2878.4;
 //   } else {
 //       return AE14;
 //   }
 // }
 
 // Function to check value for AH14
 // function checkValueAh(AF14) {
 //     if (AF14 < 275.08) {
 //         return 275.08;
 //     } else {
 //         return AF14;
 //     }
 // }
 
 function checkValueAh(AF14) {
   if (AF14 < 275.08) {
       return 275.08;
   } else if (AF14 >= 2878.4) {
     return 2878.4;
   } else {
       return AF14;
   }  
 }
 
 // Function to check value for AH14
 // function checkValueAh2(AF14) {
 //   if (AF14 > 2878.4) {
 //       return 2878.4;
 //   } else {
 //       return AF14;
 //   }                    
 // }

 function findClosestKey(target) {
   var arr = loans;
   for (let i = 0; i < arr.length; i++) {
       var realMonthly = totalMonthlyAmountDisplay(arr[i]);
       var difference = realMonthly - target;
       if (difference > 0) {
         return [totalMonthlyAmountDisplay(arr[i-1]),arr[i-1]]
       } else if(difference == 0){
         return [realMonthly,arr[i]]
       }
   }
 }
 
 function totalMonthlyAmountDisplay(selectedLoanAmount){
   loanAmountSlider.value = selectedLoanAmount;
     // Initialize variables for calculations
     if(selectedLoanAmount.toString()==="undefined"||selectedLoanAmount.toString()==="NaN"){
       return null;
     }
     var c14 = loanAmountColumn[selectedLoanAmount.toString()]; // Example value for c14
     var ae14 = c14 * 0.0112; // Calculate ae14
       //if (selectedLoanAmount >= 257500){
       //  var ag14 = checkValueAg2(ae14);
       //}else{
         var ag14 = checkValueAg(ae14); // Calculate ag14
       //}
     var af14 = c14 * 0.0112; // Calculate af14
       //if (selectedLoanAmount >= 257500){
       //  var ah14 = checkValueAh2(af14)
      // }else{
         var ah14 = checkValueAh(af14); // Calculate ah14
      // }
     d14 = ag14; // d14 is ag14
     e14 = ah14; // e14 is ah14
     f14 = c14 + d14 + e14; // Calculate f14
     g14 = -PMT(b6, term, f14); // Calculate g14
     h14 = f14 / 1000 * b8; // Calculate h14
     j14 = g14 + h14; // Calculate j14
     i14 = j14 / c9 - j14; // Calculate i14
 
     //total interest
     l14 = (g14*term)-f14;
 
     // Calculate total monthly amount 
     var totalMonthlyAmount = Number((j14 + i14).toFixed(2));
     actualInstalment.textContent = "Actual Instalment: "+ totalMonthlyAmount;

    return totalMonthlyAmount; // Output the total monthly amount
 }
 
 function viewLoanDetailsDiv(){
   var interest = rt*100//interest
   var loanTerm = term//months
   var loanAmount = document.getElementById('loanAmountSlider').value;
   var totalMonthlyInstalment = totalMonthlyAmountDisplay(loanAmount)
   var adminFee = Number(d14.toFixed(2))
   var processingFee = Number(e14.toFixed(2))
   var totalLoanAmount = Number(f14.toFixed(2));
   var monthlyInsurancePremiumm = Number(h14.toFixed(2))
   var monthlyLoanInstalment = Number(g14.toFixed(2))+monthlyInsurancePremiumm;
   var monthlyEmployerCollection = Number(i14.toFixed(2))
   var apr = 0;
 
    apr = calculateRate(loanTerm, -totalMonthlyInstalment, loanAmount,0,0,0.1)*1200;
 
   document.getElementById('InterestRate').textContent  = interest;
   document.getElementById('LoanAmountRequested').textContent  = loanAmount+ '.00';
   document.getElementById('AdminFee').textContent  = adminFee;
   document.getElementById('ProcessingFee').textContent  = processingFee;
   document.getElementById('TotalLoanAmount').textContent  = totalLoanAmount;
   document.getElementById('AnnualPercentageRate').textContent  = Number(apr.toFixed(2));
   document.getElementById('LoanTerm').textContent  = loanTerm;
   document.getElementById('MonthlyInstalments').textContent  = Number(monthlyLoanInstalment.toFixed(2));
   document.getElementById('MonthlyCreditLifePremium').textContent  = monthlyInsurancePremiumm;
   document.getElementById('MonthlyCollectionFee').textContent  = monthlyEmployerCollection;
   document.getElementById('TotalMonthlyInstalments').textContent  = totalMonthlyInstalment;
 }

 function calculateRate(nper, pmt, pv, fv, type, guess) {
   // Tolerance for convergence
   const tol = 1e-6;
   // Maximum number of iterations
   const maxIter = 100;
   
   let rate = guess;
   let iter = 0;
   
   while (iter < maxIter) {
     // Calculate the value of the function
     const f = pv * Math.pow(1 + rate, nper) + pmt * (1 + rate * type) * (Math.pow(1 + rate, nper) - 1) / rate + fv;
     
     // Calculate the value of the derivative of the function
     const df = pv * nper * Math.pow(1 + rate, nper - 1) + pmt * (1 + rate * type) * (nper * Math.pow(1 + rate, nper - 1) / rate - (Math.pow(1 + rate, nper) - 1) / Math.pow(rate, 2));
     
     // Update the estimate
     const newRate = rate - f / df;
     
     // Check for convergence
     if (Math.abs(newRate - rate) < tol) {
       return rate;
     }
     
     rate = newRate;
     iter++;
   }
   
   // Return the last estimate if no convergence
   return rate;
 }
 
 // Function to show the h3 element
 function showH3() {
   actualInstalment.classList.remove('hidden');
 }
 
 // Function to hide the h3 element
 function hideH3() {
   actualInstalment.classList.add('hidden');
 }
 document.addEventListener('DOMContentLoaded', (event) => {
 
   const loanAmountSlider = document.getElementById('loanAmountSlider');
   const decrementButton = document.getElementById('decrement');
   const incrementButton = document.getElementById('increment');
   const loanTermDropdown = document.getElementById('loanTermDropdown');
   const actualInstalment = document.getElementById('actualInstalment');;
 
   // Function to update the loan term
   function updateLoanTerm() {

     term = loanTermDropdown.value;
     updateMonthlyAmountDisplay(loanAmountSlider.value);
   }
   loanTermDropdown.addEventListener('change', updateLoanTerm);
 
   var loanInterestDropdown = document.getElementById('loanInterestDropdown');
   function updateLoanInterest() {
     rt = loanInterestDropdown.value;
     b6 = rt / 12;

     switch (loanInterestDropdown.options[loanInterestDropdown.selectedIndex].textContent) {
       case "botusafe 23%":
         c9 = 1 - 0.0271;
         break;
       case "botusafe 26%":
         c9 = 1 - 0.0271;
         break;
       case "Tawu 23%":
         c9 = 1 - 0.025;
         break;
       case "Tawu 26%":
         c9 = 1 - 0.025;
         break;
       case "Ubassu":
         c9 = 1 - 0.0268;
         break;
       case "Dikgosana":
         c9 = 1 - 0.0268;
         loanMax = 330000;
         break;
       case "Bots life":
         c9 = 1 - 0.0268;
         break;
       case "metropolitan 23%":
         c9 = 1 - 0.0268;
         b8 = 1.10;//insurance
         break;
       case "metropolitan 26%":
         c9 = 1 - 0.0268;
         b8 = 1.10//insurance
         break;
       case "Lahisa":
         c9 = 1 - 0.0268;
         break;
       case "Bpopf":
         c9 = 1 - 0.0280;
         break;
       case "botusafe 20%":
         c9 = 1 - 0.0271;
         break;
        case "Tawu Para":
          c9 = 1 - 0.025;
          break;
       default:
         break;
           // Code to be executed if expression doesn't match any case
     }
     updateMonthlyAmountDisplay(loanAmountSlider.value);
   }
   loanInterestDropdown.addEventListener('change', updateLoanInterest);
 
   // Function to update the displayed loan amount
   function updateLoanAmountDisplay(value) {
     loanAmountSlider.value = value;
     updateMonthlyAmountDisplay(value);
   }
    
   loanAmountSlider.addEventListener('input', function() {
     var number = loanAmountSlider.value;
     if (isMultipleOf500AndInRange(number)) {
       updateMonthlyAmountDisplay(number);
     } else {
       loanAmountSlider.style.color = 'red'
       number = number.slice(0, 7); // Truncate to 6 digits
       loanAmountSlider.value = number;
       monthlyPayDiv.value = ""
     }  
   });
   function isMultipleOf500AndInRange(number) {
     const isMultipleOf500 = number % 500 === 0;
     const isInRange = number >= 5000 && number <= loanMax;
     return isMultipleOf500 && isInRange;
   }
 
   function increment() {
     if(actualInstalment.classList !=='hidden'){
       monthlyPayDiv.blur()
     }
     let value = Math.round(parseInt(loanAmountSlider.value, 10) / 500) * 500;
     if (value < 5000) {
         value = 5000;
     } else if (value < loanMax) { // Adjust the max value as needed
         value += 500;
     } else if(value > loanMax){
       return
     }
     updateLoanAmountDisplay(value);
 }
  
   function decrement() {
     if(actualInstalment.classList !=='hidden'){
       monthlyPayDiv.blur()
     }
     let value = Math.round(parseInt(loanAmountSlider.value, 10) / 500) * 500;
     if(value > loanMax){
       value = loanMax;
     } else if (value > 5000) { // Adjust the min value as needed
       value -= 500;
     }else if(value < 5000){
       return
     }
     updateLoanAmountDisplay(value);
   }
 
   let intervalId;
   let timeoutId;
   let touchStartTime;
   const longPressThreshold = 500; // Threshold in milliseconds to detect a long press
 
   function handleMouseDown(action) {
     timeoutId = setTimeout(() => {
       intervalId = setInterval(action, 10); // Run every 500 ms
     }, longPressThreshold); // Delay to detect long press
   }
 
   function handleMouseUp(action) {
     clearTimeout(timeoutId);
     if (intervalId) {
       clearInterval(intervalId);
       intervalId = null;
     } else {
       action(); // Run the action if it was a click or short touch
     }
   }
 
   function handleTouchStart(action) {
     touchStartTime = new Date().getTime();
     handleMouseDown(action);
   }
 
   function handleTouchEnd(action) {
     const touchEndTime = new Date().getTime();
     const touchDuration = touchEndTime - touchStartTime;
     
     if (touchDuration < longPressThreshold) {
       clearTimeout(timeoutId); // Clear the long press timeout
       action(); // Run the action for a short touch
     } else {
       handleMouseUp(action); // Handle as a long press
     }
   }
 
   function addEventListeners(button, action) {
     button.addEventListener('mousedown', () => handleMouseDown(action));
     button.addEventListener('mouseup', () => handleMouseUp(action));
     button.addEventListener('mouseleave', () => handleMouseUp(action));
     button.addEventListener('mouseout', () => handleMouseUp(action));
 
     button.addEventListener('touchstart', (event) => {
       if (event.cancelable) {
         event.preventDefault();
         // Handle the touch event as needed
       }
       handleTouchStart(action);
     });
     button.addEventListener('touchend', (event) => {
       event.preventDefault(); // Prevent default to ensure consistent behavior
       handleTouchEnd(action);
     });
     button.addEventListener('touchcancel', (event) => {
       event.preventDefault(); // Prevent default to ensure consistent behavior
       handleMouseUp(action);
     });
     // Disable hover effect
     button.addEventListener('mouseout', (event) => {
       event.stopPropagation();
       event.preventDefault();
     });
   }
 
   addEventListeners(incrementButton, increment);
   addEventListeners(decrementButton, decrement);
 
 });
 
 var viewLoanDetailsButton = document.getElementById("viewLoanDetails")
 
 viewLoanDetailsButton.addEventListener("click",(e)=>{
 
   document.getElementById('loanDetailsDiv').style.display = 'flex';
   viewLoanDetailsDiv()
 })
 
 // Hide the loanDetailsDiv if clicking outside of it
 document.addEventListener('click', function(event) {
   var loanDetailsDiv = document.getElementById('loanDetailsDiv');
   var innerDiv = document.querySelector('.loanDetails');
   if (!innerDiv.contains(event.target) && event.target.id !== 'viewLoanDetails') {
     loanDetailsDiv.style.display = 'none';
   }
 });
 

