const app = document.getElementById('app');
const svgImages = document.querySelectorAll('.svg-image');

const squares = Array.from(svgImages).map(svg => {
  return {
    lat: parseFloat(svg.getAttribute('data-lat')),
    lng: parseFloat(svg.getAttribute('data-lng')),
    id: svg.getAttribute('id')
  };
});

let isPopupOpen = false;
let userLat;
let userLng;

// Function to show popup for location error
function showLocationErrorPopup() {
  const popupContainer = document.getElementById('popupContainer');
  popupContainer.innerHTML = `
    <div class="popup">
      Ik heb geen toegang tot je locatie, <br> Dat heb ik wel nodig.
    </div>`;
  popupContainer.style.display = 'block';
}

// Function to hide popup
function hidePopup() {
  document.getElementById('popupContainer').style.display = 'none';
  isPopupOpen = false;
}

// Function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2)  {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// maakt een arrow aan en container aan. Zet ispopupopen op true, hierdoor loopt de update sizes niet meer.
function showPopupWithArrow(lat_def, lon_def) {
  const popupContainer = document.getElementById('popupContainer');
  popupContainer.innerHTML = `
    <div class="popup" style="padding: 120px;">
    <div class="compass">
    <div class="arrow"></div>
    <div class="compass-circle"></div>
    <div class="my-point"></div>
   </div>
      <button id="closeButton" style="position: absolute; bottom: 10px; left: 10px; right: 10px; border: none; background-color: hsla(29,100%,50%,1); color: #fff; border-radius: 5px; padding: 10px; font-family: borna; font-size: 15px;">Close</button>
    </div>`;
  popupContainer.style.display = 'block';
  isPopupOpen = true;

 // dit is de code voor kompas naar Locatie



    const compassCircle = document.querySelector(".compass-circle");
    const myPoint = document.querySelector(".my-point");
    const isIOS =
      navigator.userAgent.match(/(iPod|iPhone|iPad)/) &&
      navigator.userAgent.match(/AppleWebKit/);

    function init() {
      startCompass();
      navigator.geolocation.getCurrentPosition(locationHandler);

      if (!isIOS) {
        window.addEventListener("deviceorientationabsolute", handler, true);
      }
    }

    function startCompass() {
      if (isIOS) {
        DeviceOrientationEvent.requestPermission()
          .then((response) => {
            if (response === "granted") {
              window.addEventListener("deviceorientation", handler, true);
            } else {
              alert("has to be allowed!");
            }
          })
          .catch(() => alert("not supported"));
      }
    }

    function handler(e) {
      compass = e.webkitCompassHeading || Math.abs(e.alpha - 360);
      compassCircle.style.transform = `translate(-50%, -50%) rotate(${-compass+pointDegree}deg)`;

      // ±15 degree
      if (
        (pointDegree < Math.abs(compass) &&
          pointDegree + 15 > Math.abs(compass)) ||
        pointDegree > Math.abs(compass + 15) ||
        pointDegree < Math.abs(compass)
      ) {
        myPoint.style.opacity = 0;
      } else if (pointDegree) {
        myPoint.style.opacity = 1;
      }
    }

    let pointDegree;

    function locationHandler(position) {
      const { latitude, longitude } = position.coords;
      pointDegree = calcDegreeToPoint(latitude, longitude);

      if (pointDegree < 0) {
        pointDegree = pointDegree + 360;
      }
    }

    function calcDegreeToPoint(latitude, longitude) {
      // Qibla geolocation
      const point = {
        lat: lat_def,
        lng: lon_def
      };

      const phiK = (point.lat * Math.PI) / 180.0;
      const lambdaK = (point.lng * Math.PI) / 180.0;
      const phi = (latitude * Math.PI) / 180.0;
      const lambda = (longitude * Math.PI) / 180.0;
      const psi =
        (180.0 / Math.PI) *
        Math.atan2(
          Math.sin(lambdaK - lambda),
          Math.cos(phi) * Math.tan(phiK) -
            Math.sin(phi) * Math.cos(lambdaK - lambda)
        );
      return Math.round(psi);
    }

    init();


  // Add event listener to the close button
  const closeButton = document.getElementById('closeButton');
  closeButton.addEventListener('click', function handleCloseButtonClick() {
    hidePopup();
    closeButton.removeEventListener('click', handleCloseButtonClick);
  });
}

// Function to update object sizes and handle arrow display
function updateSizes() {
  navigator.geolocation.getCurrentPosition(position => {
    if (!isPopupOpen) { // Only update when popup is closed
      hidePopup();
      userLat = position.coords.latitude;
      userLng = position.coords.longitude;

      squares.forEach(square => {
        const squareElement = document.getElementById(square.id);
        if (squareElement) {
          const distance = calculateDistance(userLat, userLng, square.lat, square.lng);

          // Adjust the size based on the distance
          let size;
          if (distance <= 10) {
            size = 400; // Max size at 10 meters
          } else if (distance >= 200) {
            size = 30; // Min size at 200 meters
          } else {
            // Linearly interpolate size between 10 and 200 meters
            size = 400 - (distance - 10) * (370 / 190); // Adjust this value as needed
          }

          // Apply the size to the element
          squareElement.style.width = `${size}px`;
          squareElement.style.height = `${size}px`;

          // Apply pulsing animation only when the user is within 30 meters
          if (distance <= 30) {
            squareElement.classList.add('pulsing');
          } else {
            squareElement.classList.remove('pulsing');
          }

          // Add click event listener to show arrow pointing towards the object
          squareElement.addEventListener('click', () => {
            showPopupWithArrow(square.lat, square.lng);
          });
        }
      });
    }
  }, error => {
    console.error('Error finding your location:', error.message);
    showLocationErrorPopup();
    // Reset square sizes to their minimum
    squares.forEach(square => {
      const squareElement = document.getElementById(square.id);
      if (squareElement) {
        squareElement.style.width = '30px';
        squareElement.style.height = '30px';
        squareElement.classList.remove('pulsing'); // Remove pulsing animation
      }
    });
  });
}

window.onload = () => {
  updateSizes();
};
setInterval(updateSizes, 500); // Update location of the visitor every second.
