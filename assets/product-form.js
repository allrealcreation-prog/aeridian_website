/**
 * @file product-form.js
 * @purpose Handles variant selection, URL updating, pricing reflection, and AJAX Add To Cart.
 * @dependencies window.AERIDIAN namespace
 * @publicAPI init(), destroy(), reInit()
 * @lifecycle Managed by ThemeEngine during shopify:section:load and unload.
 * @author AERIDIAN Core Team
 * @lastUpdated 2026-06-25
 */

(function () {
  'use strict';

  if (window.AERIDIAN && window.AERIDIAN.Modules.ProductForm) {
    return;
  }

  window.AERIDIAN.Utils.mark('ProductForm:Start');

  class AeridianProductForm {
    constructor() {
      this._events = [];
      this.abortController = null;
      this.init();
    }

    on(element, event, handler, options = false) {
      if (!element) {
        return;
      }
      element.addEventListener(event, handler, options);
      this._events.push({ element, event, handler, options });
    }

    init() {
      this.form = document.getElementById('ProductForm');
      this.submitBtn = document.getElementById('AddToCartBtn');
      this.variantIdInput = document.getElementById('VariantIdInput');
      this.priceWrap = document.getElementById('PDPPrice');
      this.stickyPrice = document.getElementById('StickyPrice');

      if (!this.form || !window.AERIDIAN.State.Product) {
        return;
      }

      this.product = window.AERIDIAN.State.Product;

      // Ensure form is actually bound
      this.bindEvents();
    }

    destroy() {
      // 1. Unbind all DOM Events
      this._events.forEach(({ element, event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });
      this._events = [];

      // 2. Abort any hanging fetches
      if (this.abortController) {
        this.abortController.abort();
      }

      window.AERIDIAN.Utils.log('ProductForm', 'destroyed');
    }

    reInit() {
      this.destroy();
      this.init();
      window.AERIDIAN.Utils.log('ProductForm', 're-initialized');
    }

    bindEvents() {
      // Listen to variant radio changes
      const radios = this.form.querySelectorAll('.js-variant-radio');
      radios.forEach((radio) => {
        this.on(radio, 'change', () => this.onVariantChange());
      });

      // Handle form submit via AJAX
      this.on(this.form, 'submit', (e) => {
        e.preventDefault();
        this.addToCart();
      });

      // Handle Quantity Buttons
      const qtyInput = this.form.querySelector('input[name="quantity"]');
      const qtyBtns = this.form.querySelectorAll('.js-qty-btn');
      if (qtyInput && qtyBtns.length > 0) {
        qtyBtns.forEach((btn) => {
          this.on(btn, 'click', () => {
            const currentVal = parseInt(qtyInput.value, 10) || 1;
            if (btn.dataset.action === 'plus') {
              qtyInput.value = currentVal + 1;
            } else if (btn.dataset.action === 'minus') {
              if (currentVal > 1) {
                qtyInput.value = currentVal - 1;
              }
            }
          });
        });
      }
    }

    onVariantChange() {
      // Get selected options
      const options = [];
      const fieldsets = Array.from(this.form.querySelectorAll('.variant-group'));

      fieldsets.forEach((group) => {
        const checked = group.querySelector('input[type="radio"]:checked');
        if (checked) {
          options.push(checked.value);
        }
      });

      // Find matching variant
      const matchedVariant = this.product.variants.find((variant) => {
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

      // 3. Update Price & Button (with GSAP transition if available)
      const performUpdate = () => {
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
          if (this.stickyPrice) {
            this.stickyPrice.innerHTML = this.formatMoney(variant.price);
          }
        }

        if (!variant.available) {
          this.submitBtn.setAttribute('disabled', 'disabled');
          this.submitBtn.textContent = 'Archived';
        } else {
          this.submitBtn.removeAttribute('disabled');
          this.submitBtn.textContent = 'Acquire Artifact';
        }
      };

      if (window.gsap && this.priceWrap) {
        gsap.to([this.priceWrap, this.submitBtn], {
          opacity: 0,
          y: -5,
          duration: 0.2,
          ease: 'power2.inOut',
          onComplete: () => {
            performUpdate();
            gsap.to([this.priceWrap, this.submitBtn], {
              opacity: 1,
              y: 0,
              duration: 0.4,
              ease: 'power2.out',
            });
          },
        });
      } else {
        performUpdate();
      }

      // 4. Update Gallery Image via Custom Event
      // If variant has an attached image, dispatch event to let main-product.liquid handle crossfade
      if (variant.featured_image) {
        const imageId = variant.featured_image.id;
        window.dispatchEvent(
          new CustomEvent('aeridian:variant-image-change', {
            detail: { imageId: imageId, variantId: variant.id },
          })
        );
      }
    }

    addToCart() {
      const formData = new FormData(this.form);
      this.submitBtn.classList.add('is-loading');

      // Abort previous requests
      if (this.abortController) {
        this.abortController.abort();
      }
      this.abortController = new AbortController();

      fetch('/cart/add.js', {
        method: 'POST',
        body: formData,
        signal: this.abortController.signal,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then((_data) => {
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
        .catch((error) => {
          if (error.name === 'AbortError') {
            window.AERIDIAN.Utils.log('ProductForm', 'Fetch aborted');
            return; // Ignore aborted requests
          }
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
  const initEngine = () => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        window.AERIDIAN.Modules.ProductForm = new AeridianProductForm();
        window.AERIDIAN.Utils.log('ProductForm', 'initialized');
        window.AERIDIAN.Utils.mark('ProductForm:End');
        window.AERIDIAN.Utils.measure('ProductForm:Init', 'ProductForm:Start', 'ProductForm:End');
      });
    } else {
      window.AERIDIAN.Modules.ProductForm = new AeridianProductForm();
      window.AERIDIAN.Utils.log('ProductForm', 'initialized');
      window.AERIDIAN.Utils.mark('ProductForm:End');
      window.AERIDIAN.Utils.measure('ProductForm:Init', 'ProductForm:Start', 'ProductForm:End');
    }
  };

  initEngine();
})();
