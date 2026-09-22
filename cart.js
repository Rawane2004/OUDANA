/* =========================================================
   OUDANA — SHARED CART
   One cart system for the whole website
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const CART_SUPABASE_URL =
    "https://gpncttjpcucnbaatwjoy.supabase.co";

const CART_SUPABASE_KEY =
    "sb_publishable_emYCVcv_b9gLa62n3D1pPg_lI5xRnD4";

const cartSupabase =
    supabase.createClient(
        CART_SUPABASE_URL,
        CART_SUPABASE_KEY
    );


/* =========================================================
   CART STATE
========================================================= */

let sharedCart = [];

let sharedCartStorageKey =
    "oudana_cart_guest";


/* =========================================================
   GET CURRENT USER
========================================================= */

async function getCartUser() {

    try {

        const {
            data,
            error
        } = await cartSupabase.auth.getUser();


        if (error || !data?.user) {

            return null;

        }


        return data.user;

    } catch {

        return null;

    }

}


/* =========================================================
   INITIALIZE CART
========================================================= */

async function initializeSharedCart() {

    const user =
        await getCartUser();


    if (user) {

        sharedCartStorageKey =
            `oudana_cart_${user.id}`;

    } else {

        sharedCartStorageKey =
            "oudana_cart_guest";

    }


    sharedCart =
        loadSharedCart();


    updateSharedCartCount();

}


/* =========================================================
   LOAD CART
========================================================= */

function loadSharedCart() {

    try {

        const saved =
            localStorage.getItem(
                sharedCartStorageKey
            );


        if (!saved) {

            return [];

        }


        const parsed =
            JSON.parse(saved);


        return Array.isArray(parsed)
            ? parsed
            : [];


    } catch {

        return [];

    }

}


/* =========================================================
   SAVE CART
========================================================= */

function saveSharedCart() {

    localStorage.setItem(
        sharedCartStorageKey,
        JSON.stringify(sharedCart)
    );


    updateSharedCartCount();

}


/* =========================================================
   CART COUNT
========================================================= */

function updateSharedCartCount() {

    const count =
        sharedCart.reduce(
            (total, item) =>
                total +
                Number(item.quantity || 0),
            0
        );


    document
        .querySelectorAll(".cart-count")
        .forEach(element => {

            element.textContent =
                count;


            element.style.display =
                count > 0
                    ? "grid"
                    : "none";

        });

}


/* =========================================================
   CART ELEMENTS
========================================================= */

function getCartElements() {

    return {

        button:
            document.querySelector(
                ".cart-btn"
            ),

        drawer:
            document.querySelector(
                ".cart-drawer"
            ),

        overlay:
            document.querySelector(
                ".cart-overlay"
            ),

        close:
            document.querySelector(
                ".cart-close"
            ),

        content:
            document.querySelector(
                ".cart-content"
            )

    };

}


/* =========================================================
   OPEN CART
========================================================= */

function openSharedCart() {

    const {
        drawer,
        overlay
    } =
        getCartElements();


    if (!drawer) return;


    renderSharedCart();


    drawer.classList.add(
        "open"
    );


    overlay?.classList.add(
        "open"
    );


    document.body.classList.add(
        "no-scroll"
    );

}


/* =========================================================
   CLOSE CART
========================================================= */

function closeSharedCart() {

    const {
        drawer,
        overlay
    } =
        getCartElements();


    drawer?.classList.remove(
        "open"
    );


    overlay?.classList.remove(
        "open"
    );


    document.body.classList.remove(
        "no-scroll"
    );

}


/* =========================================================
   RENDER CART
========================================================= */

function renderSharedCart() {

    const {
        content
    } =
        getCartElements();


    if (!content) return;


    /* EMPTY */

    if (!sharedCart.length) {

        content.innerHTML = `

            <div class="cart-empty">

                <i class="fa-solid fa-bag-shopping"></i>

                <h3>
                    سلتك فارغة
                </h3>

                <p>
                    أضيفي منتجاتك المفضلة
                    لتبدأ رحلتك مع عودانا.
                </p>

                <a
                    href="menu.html"
                    class="dark-btn">

                    اكتشفي المنتجات

                </a>

            </div>

        `;

        return;

    }


    /* SUBTOTAL */

    const subtotal =
        sharedCart.reduce(
            (sum, item) =>
                sum +
                (
                    Number(item.price || 0) *
                    Number(item.quantity || 0)
                ),
            0
        );


    /* CART HTML */

    content.innerHTML = `

        <div class="cart-items">

            ${sharedCart.map(item => `

                <div
                    class="cart-item"
                    data-id="${escapeSharedHTML(item.id)}">

                    <div class="cart-item-image">

                        ${
                            item.image_url
                                ? `
                                    <img
                                        src="${escapeSharedHTML(item.image_url)}"
                                        alt="${escapeSharedHTML(item.name)}">
                                `
                                : `
                                    <i class="fa-solid fa-bottle-droplet"></i>
                                `
                        }

                    </div>


                    <div class="cart-item-info">

                        <span>
                            ${escapeSharedHTML(
                                item.category || ""
                            )}
                        </span>


                        <h4>
                            ${escapeSharedHTML(
                                item.name
                            )}
                        </h4>


                        <strong>
                            ${formatSharedPrice(
                                item.price
                            )}
                            ر.س
                        </strong>


                        <div class="cart-item-actions">

                            <button
                                class="quantity-btn"
                                data-action="decrease"
                                data-id="${escapeSharedHTML(item.id)}">

                                −

                            </button>


                            <span>
                                ${item.quantity}
                            </span>


                            <button
                                class="quantity-btn"
                                data-action="increase"
                                data-id="${escapeSharedHTML(item.id)}">

                                +

                            </button>

                        </div>

                    </div>


                    <button
                        class="remove-cart-item"
                        data-id="${escapeSharedHTML(item.id)}"
                        aria-label="حذف">

                        <i class="fa-solid fa-xmark"></i>

                    </button>

                </div>

            `).join("")}

        </div>


        <div class="cart-summary">

            <div>

                <span>
                    المجموع
                </span>


                <strong>
                    ${formatSharedPrice(
                        subtotal
                    )}
                    ر.س
                </strong>

            </div>


            <button
                class="gold-btn checkout-btn"
                id="sharedCheckoutBtn">

                إتمام الطلب

                <i class="fa-solid fa-arrow-left"></i>

            </button>

        </div>

    `;


    bindSharedCartActions();

}


/* =========================================================
   CART ACTIONS
========================================================= */

function bindSharedCartActions() {

    document
        .querySelectorAll(
            ".cart-item .quantity-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset.id;


                    const action =
                        button.dataset.action;


                    const item =
                        sharedCart.find(
                            item =>
                                String(item.id) ===
                                String(id)
                        );


                    if (!item) return;


                    if (
                        action ===
                        "increase"
                    ) {

                        item.quantity += 1;

                    }


                    if (
                        action ===
                        "decrease"
                    ) {

                        item.quantity -= 1;

                    }


                    if (
                        item.quantity <= 0
                    ) {

                        sharedCart =
                            sharedCart.filter(
                                item =>
                                    String(item.id) !==
                                    String(id)
                            );

                    }


                    saveSharedCart();

                    renderSharedCart();

                }
            );

        });


    document
        .querySelectorAll(
            ".remove-cart-item"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset.id;


                    sharedCart =
                        sharedCart.filter(
                            item =>
                                String(item.id) !==
                                String(id)
                        );


                    saveSharedCart();

                    renderSharedCart();

                }
            );

        });


    document
        .getElementById(
            "sharedCheckoutBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "checkout.html";

            }
        );

}


/* =========================================================
   ADD PRODUCT
========================================================= */

function addProductToSharedCart(
    product,
    quantity = 1
) {

    const existing =
        sharedCart.find(
            item =>
                String(item.id) ===
                String(product.id)
        );


    if (existing) {

        existing.quantity +=
            Number(quantity);

    } else {

        sharedCart.push({

            id:
                product.id,

            name:
                product.name,

            price:
                Number(product.price || 0),

            image_url:
                product.image_url || null,

            category:
                product.category || "",

            quantity:
                Number(quantity)

        });

    }


    saveSharedCart();

}


/* =========================================================
   FORMAT PRICE
========================================================= */

function formatSharedPrice(price) {

    return Number(price || 0)
        .toLocaleString(
            "ar-SA",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeSharedHTML(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   EVENTS
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await initializeSharedCart();


        const {
            button,
            close,
            overlay
        } =
            getCartElements();


        button?.addEventListener(
            "click",
            openSharedCart
        );


        close?.addEventListener(
            "click",
            closeSharedCart
        );


        overlay?.addEventListener(
            "click",
            closeSharedCart
        );

    }
);


/* =========================================================
   AUTH STATE CHANGE
   Re-load cart when user changes
========================================================= */

cartSupabase.auth.onAuthStateChange(
    async () => {

        await initializeSharedCart();

        renderSharedCart();

    }
);