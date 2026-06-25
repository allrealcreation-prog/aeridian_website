/**
 * AERIDIAN Product Form Engine
 * Handles variant selection, pricing updates, and AJAX Add To Cart.
 */

class AeridianProductForm {
  constructor() {
    this.form = document.getElementById('ProductForm');
    this.submitBtn = document.getElementById('AddToCartBtn');
    this.variantIdInput = document.getElementById('VariantIdInput');
    this.priceWrap = document.getElementById('PDPPrice');
    this.stickyPrice = document.getElementById('StickyPrice');
    
    if (!this.form || !window.AERIDIAN_PRODUCT) return;

    this.product = window.AERIDIAN_PRODUCT;
    this.bindEvents();
  }

  bindEvents() {
    // Listen to variant radio changes
    const radios = this.form.querySelectorAll('.js-variant-radio');
    radios.forEach(radio => {
      radio.addEventListener('change', () => this.onVariantChange());
    });

    // Handle form submit via AJAX
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addToCart();
    });

    // Handle Quantity Buttons
    const qtyInput = this.form.querySelector('input[name="quantity"]');
    const qtyBtns = this.form.querySelectorAll('.js-qty-btn');
    if (qtyInput && qtyBtns.length > 0) {
      qtyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          let currentVal = parseInt(qtyInput.value, 10) || 1;
          if (btn.dataset.action === 'plus') {
            qtyInput.value = currentVal + 1;
          } else if (btn.dataset.action === 'minus') {
            if (currentVal > 1) qtyInput.value = currentVal - 1;
          }
        });
      });
    }
  }

  onVariantChange() {
    // Get selected options
    const options = [];
    const fieldsets = Array.from(this.form.querySelectorAll('.variant-group'));
    
    fieldsets.forEach(group => {
      const checked = group.querySelector('input[type="radio"]:checked');
      if (checked) options.push(checked.value);
    });

    // Find matching variant
    const matchedVariant = this.product.variants.find(variant => {
      return variant.options.every((opt, index) => opt === options[index]);
    });

    if (matchedVariant) {
      this.updateState(matchedVariant);
    }
  }

  updateState(variant) {
    // 1. Update Hidden ID
    this.variantIdInput.value = variant.id;

    // 2. Update URL silently
    const url = new URL(window.location.href);
    url.searchParams.set('variant', variant.id);
    window.history.replaceState({}, '', url);

    // 3. Update Price
    if (this.priceWrap) {
      let priceHtml = '';
      if (variant.compare_at_price > variant.price) {
        priceHtml = `
          <span class="pdp-price--compare">${this.formatMoney(variant.compare_at_price)}</span>
          <span class="pdp-price--sale">${this.formatMoney(variant.price)}</span>
        `;
      } else {
        priceHtml = `<span>${this.formatMoney(variant.price)}</span>`;
      }
      this.priceWrap.innerHTML = priceHtml;
      if (this.stickyPrice) this.stickyPrice.innerHTML = this.formatMoney(variant.price);
    }

    // 4. Update Button State
    if (!variant.available) {
      this.submitBtn.setAttribute('disabled', 'disabled');
      this.submitBtn.textContent = 'Archived';
    } else {
      this.submitBtn.removeAttribute('disabled');
      this.submitBtn.textContent = 'Acquire Artifact';
    }
  }

  addToCart() {
    const formData = new FormData(this.form);
    
    this.submitBtn.classList.add('is-loading');

    fetch('/cart/add.js', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      this.submitBtn.classList.remove('is-loading');
      
      // Feedback animation
      const originalText = this.submitBtn.textContent;
      this.submitBtn.textContent = 'Acquired';
      this.submitBtn.style.background = 'var(--text-primary)';
      this.submitBtn.style.color = 'var(--bg-primary)';
      
      setTimeout(() => {
        this.submitBtn.textContent = originalText;
        this.submitBtn.style.background = '';
        this.submitBtn.style.color = '';
      }, 2000);

      // Trigger global header cart update event (can be hooked into by header.liquid)
      window.dispatchEvent(new CustomEvent('aeridian:cart-updated'));
    })
    .catch(error => {
      console.error('AERIDIAN Cart Error:', error);
      this.submitBtn.classList.remove('is-loading');
      this.submitBtn.textContent = 'Error. Try Again.';
    });
  }

  formatMoney(cents) {
    return '$' + (cents / 100).toFixed(2);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new AeridianProductForm();
});
