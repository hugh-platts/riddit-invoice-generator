// script.js

document.addEventListener('DOMContentLoaded', () => {
  // Form Elements
  const invoiceForm = document.getElementById('invoice-form');
  const postcodeInput = document.getElementById('postcode');
  const addressSuggestions = document.getElementById('address-suggestions');
  const addressFields = document.getElementById('address-fields');
  const enterAddressManuallyButton = document.getElementById('enter-address-manually');
  const addItemButton = document.getElementById('add-item');
  const itemsContainer = document.getElementById('items-container');
  const bankOptions = document.getElementsByName('bankDetails');
  const bankOption1 = document.getElementById('bank-option1');
  const bankOption2 = document.getElementById('bank-option2');
  const generateInvoiceButton = document.getElementById('generateInvoice');
  const includeCourierCheckbox = document.getElementById('includeCourier');
  const courierDetails = document.getElementById('courier-details');
  const footerInput = document.getElementById('footer');
  const paymentInstructionsTextarea = document.getElementById('paymentInstructions');
  
  // Invoice Number and Date Fields in Form
  const invoiceNumberField = document.getElementById('invoiceNumber');
  const invoiceSequenceField = document.getElementById('invoiceSequence');
  const invoiceDateField = document.getElementById('invoiceDate');

  // Set default values for Footer
  footerInput.value = "For any inquiries, please contact us at Mjplatts@hotmail.co.uk or call 07713883813.";

  // Initialize Invoice Date and Number
  initializeInvoice();

  // Ensure 'required' on postcode input when page loads
  postcodeInput.required = true;

  /**
   * Debounce function to limit the rate at which a function can fire.
   * Useful for limiting API calls during user input.
   */
  function debounce(func, delay) {
    let debounceTimer;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
  }

  /**
   * Sanitize user input to prevent Cross-Site Scripting (XSS) attacks.
   * @param {string} str - The string to sanitize.
   * @returns {string} - The sanitized string.
   */
  function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
  }

  /**
   * Initialize Invoice Date and Number
   */
  function initializeInvoice() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months start at 0!
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${dd}/${mm}/${yyyy}`;
    invoiceDateField.value = formattedDate;

    // Generate Invoice Number Prefix
    const dateForInvoice = `${yyyy}${mm}${dd}`;
    const invoicePrefix = `INV-${dateForInvoice}-`;
    invoiceNumberField.value = invoicePrefix;

    // Initialize or Retrieve Sequence Number from localStorage
    const lastSequence = localStorage.getItem(`invoiceSequence-${dateForInvoice}`);
    let sequenceNumber = 1;
    if (lastSequence) {
      const parsedSequence = parseInt(lastSequence, 10);
      if (!isNaN(parsedSequence)) {
        sequenceNumber = parsedSequence + 1;
      }
    }
    const formattedSequence = String(sequenceNumber).padStart(3, '0');
    invoiceSequenceField.value = formattedSequence;

    // Save the new sequence number to localStorage
    localStorage.setItem(`invoiceSequence-${dateForInvoice}`, formattedSequence);
  }

  /**
   * Handle input in the postcode field with debounce.
   * Fetch address suggestions from the GetAddress.io API.
   */
  postcodeInput.addEventListener('input', debounce(handlePostcodeInput, 300));

  function handlePostcodeInput(event) {
    const term = event.target.value.trim();
    if (term.length < 3) {
      // Hide suggestions and address fields if input is less than 3 characters
      addressSuggestions.innerHTML = '';
      addressSuggestions.style.display = 'none';
      addressFields.style.display = 'none';
      postcodeInput.required = true;
      return;
    }

    // Fetch address suggestions from GetAddress.io
    fetch(`https://api.getaddress.io/autocomplete/${encodeURIComponent(term)}?api-key=6VGcyzwtQ0iq-6d0YoFK8w44913`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('API Response Data:', data);
        if (data.suggestions && Array.isArray(data.suggestions)) {
          displaySuggestions(data.suggestions);
        } else if (data.Message) {
          throw new Error(`API Error: ${data.Message}`);
        } else {
          throw new Error('Unexpected API response format.');
        }
      })
      .catch(error => {
        console.error('Error fetching address suggestions:', error);
        addressSuggestions.innerHTML = `<div class="list-group-item text-danger">Error: ${error.message}</div>`;
        addressSuggestions.style.display = 'block';
      });
  }

  /**
   * Display address suggestions in the dropdown.
   * @param {Array} suggestions - Array of suggestion objects from the API.
   */
  function displaySuggestions(suggestions) {
    addressSuggestions.innerHTML = '';
    if (!suggestions || suggestions.length === 0) {
      addressSuggestions.innerHTML = `<div class="list-group-item">No addresses found.</div>`;
    } else {
      suggestions.forEach(suggestion => {
        const item = document.createElement('button');
        item.type = 'button';
        item.classList.add('list-group-item', 'list-group-item-action');
        item.textContent = suggestion.address; // Access the 'address' property
        // When a suggestion is clicked, populate the address fields
        item.addEventListener('click', () => populateAddressFields(suggestion.address)); // Pass the address string
        addressSuggestions.appendChild(item);
      });
    }
    addressSuggestions.style.display = 'block';
  }

  /**
   * Populate the address fields with the selected address.
   * @param {string} address - The full address string.
   */
  function populateAddressFields(address) {
    const addressParts = address.split(',').map(part => part.trim());
    
    const addressLine1 = addressParts[0] || '';
    const addressLine2 = addressParts[1] || '';
    const city = addressParts[2] || '';
    const postalCode = addressParts[addressParts.length - 1] || '';
    const country = 'United Kingdom';
    
    document.getElementById('addressLine1').value = addressLine1;
    document.getElementById('addressLine2').value = addressLine2;
    document.getElementById('city').value = city;
    document.getElementById('postalCode').value = postalCode;
    document.getElementById('country').value = country;
    
    // Show the address fields
    addressFields.style.display = 'block';
    
    // Make address fields read-only and required
    ['addressLine1', 'addressLine2', 'city', 'postalCode', 'country'].forEach(id => {
      const field = document.getElementById(id);
      field.readOnly = true;
      field.required = true;
    });
    
    // Remove 'required' from postcode input
    postcodeInput.required = false;
    
    // Hide the address suggestions dropdown
    addressSuggestions.style.display = 'none';
  }

  /**
   * Event listener for the "Enter Address Manually" button.
   * Allows users to manually enter their address if autofill is not desired.
   */
  enterAddressManuallyButton.addEventListener('click', () => {
    // Show the address fields
    addressFields.style.display = 'block';
    // Hide postcode input and suggestions
    postcodeInput.style.display = 'none';
    addressSuggestions.style.display = 'none';
    // Remove 'required' from postcode input
    postcodeInput.required = false;
    // Clear postcode input
    postcodeInput.value = '';
    // Make address fields editable and required
    ['addressLine1', 'addressLine2', 'city', 'postalCode', 'country'].forEach(id => {
      const field = document.getElementById(id);
      field.readOnly = false;
      field.required = true;
    });
  });

  /**
   * Function to add a new item row in the Items section.
   */
  addItemButton.addEventListener('click', () => {
    const itemRow = document.createElement('div');
    itemRow.classList.add('row', 'mb-2', 'item');
    itemRow.innerHTML = `
      <div class="col-md-4">
        <input type="text" class="form-control" placeholder="Item Description" required>
      </div>
      <div class="col-md-3">
        <input type="number" class="form-control" placeholder="Amount (£)" min="0" step="0.01" required>
      </div>
      <div class="col-md-3">
        <input type="text" class="form-control" placeholder="Image URL (Optional)">
      </div>
      <div class="col-md-2">
        <button type="button" class="btn btn-danger remove-item">Remove</button>
      </div>
    `;
    itemsContainer.appendChild(itemRow);
  });

  /**
   * Event Delegation for Remove Item Buttons.
   * Allows removal of any item row dynamically.
   */
  itemsContainer.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('remove-item')) {
      e.target.closest('.item').remove();
    }
  });

  /**
   * Toggle bank details sections based on the selected radio button.
   */
  bankOptions.forEach(option => {
    option.addEventListener('change', () => {
      if (option.value === 'option1') {
        bankOption1.style.display = 'block';
        bankOption2.style.display = 'none';
        // Remove required attributes from option2 fields
        document.querySelectorAll('#bank-option2 input').forEach(input => {
          input.required = false;
        });
      } else {
        bankOption1.style.display = 'none';
        bankOption2.style.display = 'block';
        // Add required attributes to option2 fields
        document.querySelectorAll('#bank-option2 input').forEach(input => {
          input.required = true;
        });
      }
    });
  });

  /**
   * Toggle Courier Details and Payment Instructions based on the checkbox.
   */
  includeCourierCheckbox.addEventListener('change', () => {
    if (includeCourierCheckbox.checked) {
      courierDetails.style.display = 'block';
      // Make courier and payment instruction fields required
      document.getElementById('courierName').required = true;
      document.getElementById('courierNumber').required = true;
      document.getElementById('paymentInstructions').required = true;
    } else {
      courierDetails.style.display = 'none';
      // Remove required attributes
      document.getElementById('courierName').required = false;
      document.getElementById('courierNumber').required = false;
      document.getElementById('paymentInstructions').required = false;
      // Clear values
      document.getElementById('courierName').value = '';
      document.getElementById('courierNumber').value = '';
      document.getElementById('paymentInstructions').value = '';
    }
  });

  /**
   * Enhanced form validation to specify which fields are missing.
   */
  generateInvoiceButton.addEventListener('click', () => {
    // Collect all required fields that are visible
    const requiredFields = Array.from(invoiceForm.querySelectorAll('[required]')).filter(field => {
      return field.offsetParent !== null; // Only include visible fields
    });

    // Collect names of fields that are invalid
    const invalidFields = requiredFields.filter(field => !field.checkValidity()).map(field => {
      // Prefer the label's text if available
      const label = invoiceForm.querySelector(`label[for="${field.id}"]`);
      if (label) {
        return label.textContent.replace(' *', '').trim();
      }
      // Otherwise, use the placeholder or name
      return field.placeholder || field.name || 'Unnamed Field';
    });

    if (invalidFields.length > 0) {
      // Create a message listing the missing fields
      const message = `Please fill in the following required fields:\n- ${invalidFields.join('\n- ')}`;
      alert(message);
      // Optionally, focus the first invalid field
      const firstInvalidField = requiredFields.find(field => !field.checkValidity());
      if (firstInvalidField) {
        firstInvalidField.focus();
      }
      return;
    }

    // Gather form data
    const invoiceToName = document.getElementById('invoiceToName').value.trim();
    const invoiceEmail = document.getElementById('invoiceEmail').value.trim();

    // Gather address data
    const addressLine1 = document.getElementById('addressLine1').value.trim();
    const addressLine2 = document.getElementById('addressLine2').value.trim();
    const city = document.getElementById('city').value.trim();
    const postalCode = document.getElementById('postalCode').value.trim();
    const country = document.getElementById('country').value.trim();

    // Gather items
    const items = [];
    let itemsValid = true;
    document.querySelectorAll('.item').forEach(item => {
      const description = item.querySelector('input[type="text"][placeholder="Item Description"]').value.trim();
      const amount = item.querySelector('input[type="number"][placeholder="Amount (£)"]').value.trim();
      const imageUrl = item.querySelector('input[type="text"][placeholder="Image URL (Optional)"]').value.trim();

      if (description === '' || amount === '') {
        itemsValid = false;
      }
      items.push({ description, amount, imageUrl });
    });

    if (!itemsValid || items.length === 0) {
      alert('Please fill in all item descriptions and amounts.');
      return;
    }

    let paymentInstructions = '';
    // Courier Details
    let courierName = '';
    let courierNumber = '';
    if (includeCourierCheckbox.checked) {
      courierName = document.getElementById('courierName').value.trim();
      courierNumber = document.getElementById('courierNumber').value.trim();
      paymentInstructions = paymentInstructionsTextarea.value.trim();
    }

    // Bank Details
    let bankDetails = '';
    if (document.getElementById('option1').checked) {
      bankDetails = `
        Mrs Marcia Platts<br>
        A/c. 64237273<br>
        Sort. 01-08-38
      `;
    } else {
      const accountHolder = document.getElementById('accountHolder').value.trim();
      const accountNumber = document.getElementById('accountNumber').value.trim();
      const sortCode = document.getElementById('sortCode').value.trim();

      // Additional validation for Option 2
      if (accountHolder === '' || accountNumber === '' || sortCode === '') {
        alert('Please fill in all bank details for Option 2.');
        return;
      }

      bankDetails = `
        ${sanitizeHTML(accountHolder)}<br>
        A/c. ${sanitizeHTML(accountNumber)}<br>
        Sort. ${sanitizeHTML(sortCode)}
      `;
    }

    const footer = footerInput.value.trim();

    // Gather Invoice Number and Sequence
    const invoiceNumberPrefix = invoiceNumberField.value; // "INV-YYYYMMDD-"
    let invoiceSequence = invoiceSequenceField.value.trim(); // User-editable sequence number

    // Validate Sequence Number
    const sequenceNumberInt = parseInt(invoiceSequence, 10);
    if (isNaN(sequenceNumberInt) || sequenceNumberInt < 1 || sequenceNumberInt > 999) {
      alert('Please enter a valid sequence number between 001 and 999.');
      invoiceSequenceField.focus();
      return;
    }

    // Format Sequence Number
    invoiceSequence = String(sequenceNumberInt).padStart(3, '0');

    // Construct Full Invoice Number
    const invoiceNumber = `${invoiceNumberPrefix}${invoiceSequence}`;
    invoiceNumberField.value = invoiceNumber;

    // Save the new sequence number to localStorage
    const dateForInvoice = invoiceNumberPrefix.split('-')[1]; // Extract YYYYMMDD
    localStorage.setItem(`invoiceSequence-${dateForInvoice}`, invoiceSequence);

    // Generate invoice HTML
    const invoiceHTML = `
      <div class="p-4 invoice-pdf-content">
        <!-- Company Logo -->
        <div class="text-center mb-4">
          <img src="https://github.com/hugh-platts/riddit-invoice-generator/blob/main/darklogo2.png?raw=true" alt="Company Logo" class="invoice-logo">
        </div>
        <h2>Invoice</h2>
        <p><strong>Invoice Number:</strong> ${sanitizeHTML(invoiceNumber)}</p>
        <p><strong>Invoice Date:</strong> ${sanitizeHTML(invoiceDateField.value)}</p>
        <p><strong>Invoice To:</strong> ${sanitizeHTML(invoiceToName)}</p>
        <p><strong>Address:</strong><br>
          ${sanitizeHTML(addressLine1)}<br>
          ${sanitizeHTML(addressLine2)}<br>
          ${sanitizeHTML(city)}, ${sanitizeHTML(postalCode)}<br>
          ${sanitizeHTML(country)}
        </p>
        <p><strong>Email:</strong> ${sanitizeHTML(invoiceEmail)}</p>
        
        <h4>Items</h4>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount (£)</th>
              <th>Image</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${sanitizeHTML(item.description)}</td>
                <td>${parseFloat(item.amount).toFixed(2)}</td>
                <td>${item.imageUrl ? `<img src="${sanitizeHTML(item.imageUrl)}" alt="Item Image" class="item-image" crossorigin="anonymous">` : 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        ${includeCourierCheckbox.checked && paymentInstructions ? `<h4>Payment Instructions</h4><p>${sanitizeHTML(paymentInstructions)}</p>` : ''}
        
        ${courierName || courierNumber ? `
          <h4>Courier Contact Details</h4>
          <p>Name: ${sanitizeHTML(courierName)}</p>
          <p>Number: ${sanitizeHTML(courierNumber)}</p>
        ` : ''}
        
        <h4>Bank Details</h4>
        <p>${bankDetails}</p>
        
        <h4>Regards</h4>
        <p>Thank you for your business!<br>Marcia<br>(Riddit Homes)</p>
        
        <footer class="mt-4">
          <p>${sanitizeHTML(footer)}</p>
        </footer>
      </div>
    `;

    // Insert the invoice HTML into the hidden invoice container
    const invoiceContainer = document.getElementById('invoice-content');
    if (!invoiceContainer) {
      console.error('Element with ID "invoice-content" not found.');
      return;
    }
    invoiceContainer.innerHTML = invoiceHTML;
    // Ensure the invoice-content is accessible to jsPDF's html method
    invoiceContainer.style.display = 'block'; // Temporarily make it visible

    // Generate and download PDF
    generatePDF(invoiceToName, invoiceNumber);
  });

  /**
   * Function to generate PDF using jsPDF's html method.
   * Handles multi-page content and provides a loading indicator.
   * @param {string} recipientName - The name of the invoice recipient.
   * @param {string} invoiceNumber - The generated invoice number.
   */
  async function generatePDF(recipientName, invoiceNumber) {
    const { jsPDF } = window.jspdf;
    const invoiceContent = document.querySelector('.invoice-pdf-content');

    if (!invoiceContent) {
      console.error('Invoice content element not found.');
      return;
    }

    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.innerHTML = `
      <div class="d-flex align-items-center">
        <strong>Generating PDF...</strong>
        <div class="spinner-border ms-3" role="status" aria-hidden="true"></div>
      </div>
    `;
    loadingIndicator.style.position = 'fixed';
    loadingIndicator.style.top = '50%';
    loadingIndicator.style.left = '50%';
    loadingIndicator.style.transform = 'translate(-50%, -50%)';
    loadingIndicator.style.backgroundColor = '#fff';
    loadingIndicator.style.padding = '20px';
    loadingIndicator.style.border = '1px solid #333';
    loadingIndicator.style.zIndex = '1000';
    document.body.appendChild(loadingIndicator);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Options for html2canvas
      const options = {
        scale: 0.24, // Adjusted scale as per user's feedback
        useCORS: true, // Enable cross-origin images
        logging: true,
        windowWidth: invoiceContent.scrollWidth,
        windowHeight: invoiceContent.scrollHeight,
      };

      // Use jsPDF's html method to handle multi-page
      await pdf.html(invoiceContent, {
        callback: function (pdfDoc) {
          // Define the filename as "RecipientName_INV-YYYYMMDD-XXX.pdf"
          const sanitizedRecipientName = recipientName.replace(/[^a-z0-9]/gi, '_'); // Replace non-alphanumerics with underscores
          const filename = `${sanitizedRecipientName}_${invoiceNumber}.pdf`;
          pdfDoc.save(filename);
        },
        x: 10,
        y: 10,
        width: 190, // Width in mm (A4 width is 210mm - 2*10mm margins)
        windowWidth: invoiceContent.scrollWidth,
        html2canvas: options,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF. Please try again.');
    } finally {
      // Remove loading indicator
      document.body.removeChild(loadingIndicator);
      // Hide the invoice content again
      invoiceContent.style.display = 'none';
    }
  }
});
