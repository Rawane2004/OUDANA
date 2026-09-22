/* =========================================================
   OUDANA — MAIN.JS
   Products + Search + Categories + Cart + Favorites
   Supabase + Realtime
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://gpncttjpcucnbaatwjoy.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_emYCVcv_b9gLa62n3D1pPg_lI5xRnD4";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================================
   DOM
========================================================= */

const productsGrid =
    document.getElementById("productsGrid");

const productsLoading =
    document.getElementById("productsLoading");

const productsEmpty =
    document.getElementById("productsEmpty");

const productsResultCount =
    document.getElementById("productsResultCount");

const categoryFilters =
    document.getElementById("categoryFilters");

const productSearch =
    document.getElementById("productSearch");

const cartCount =
    document.getElementById("cartCount");


/* =========================================================
   STATE
========================================================= */

let allProducts = [];

let currentCategory = "all";

let currentSearch = "";


/* =========================================================
   CART COUNT
========================================================= */

function updateCartCount() {

    if (!cartCount) {
        return;
    }

    try {

        const possibleKeys = [
            "oudana_cart",
            "oudana_cart_guest"
        ];

        let cart = [];


        for (const key of possibleKeys) {

            const saved =
                localStorage.getItem(key);

            if (!saved) {
                continue;
            }


            try {

                const parsed =
                    JSON.parse(saved);

                if (Array.isArray(parsed)) {

                    cart = parsed;

                    break;

                }

            } catch {

                cart = [];

            }

        }


        const count =
            cart.reduce(
                (total, item) => {

                    return total +
                        Number(
                            item.quantity || 1
                        );

                },
                0
            );


        cartCount.textContent =
            count.toLocaleString("ar-SA");


    } catch (error) {

        console.error(
            "Cart count error:",
            error
        );

    }

}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadProducts() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const categoryFromUrl =
        params.get("category");


    if (categoryFromUrl) {

        currentCategory =
            categoryFromUrl;

    }


    showLoading();


    try {

        const {
            data,
            error
        } =
            await supabaseClient

                .from("products")

                .select(`
    id,
    name,
    description,
    category,
    price,
    image_url,
    rating,
    sales_count,
    stock_quantity,
    is_available,
    is_featured,
    created_at,
    updated_at
`)

                .eq(
                    "is_available",
                    true
                )

                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            throw error;

        }


        allProducts =
            data || [];


        hideLoading();


        buildCategoryFilters();

        renderProducts();

        updateCartCount();


    } catch (error) {

        console.error(
            "Products error:",
            error
        );


        hideLoading();

        showProductsError();

    }

}


/* =========================================================
   CATEGORY FILTERS
========================================================= */

function buildCategoryFilters() {

    if (!categoryFilters) {
        return;
    }


    const categories = [

        ...new Set(

            allProducts

                .map(
                    product =>
                        product.category
                )

                .filter(Boolean)

        )

    ];


    categoryFilters.innerHTML = "";


    /* =====================================================
       ALL
    ===================================================== */

    const allButton =
        document.createElement(
            "button"
        );


    allButton.className =
        "menu-filter";


    allButton.dataset.category =
        "all";


    allButton.textContent =
        "الكل";


    if (
        currentCategory === "all"
    ) {

        allButton.classList.add(
            "active"
        );

    }


    categoryFilters.appendChild(
        allButton
    );


    /* =====================================================
       CATEGORIES
    ===================================================== */

    categories.forEach(
        category => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "menu-filter";


            button.dataset.category =
                category;


            button.textContent =
                category;


            if (
                currentCategory ===
                category
            ) {

                button.classList.add(
                    "active"
                );

            }


            categoryFilters.appendChild(
                button
            );

        }
    );


    /* =====================================================
       EVENTS
    ===================================================== */

    document
        .querySelectorAll(
            ".menu-filter"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".menu-filter"
                            )
                            .forEach(
                                btn => {

                                    btn.classList.remove(
                                        "active"
                                    );

                                }
                            );


                        button.classList.add(
                            "active"
                        );


                        currentCategory =
                            button.dataset.category;


                        renderProducts();

                    }
                );

            }
        );

}


/* =========================================================
   FILTER PRODUCTS
========================================================= */

function getFilteredProducts() {

    return allProducts.filter(
        product => {

            const categoryMatch =
                currentCategory === "all" ||
                product.category ===
                    currentCategory;


            const searchText =
                currentSearch
                    .trim()
                    .toLowerCase();


            const searchMatch =
                !searchText ||

                product.name
                    ?.toLowerCase()
                    .includes(
                        searchText
                    ) ||

                product.category
                    ?.toLowerCase()
                    .includes(
                        searchText
                    ) ||

                product.description
                    ?.toLowerCase()
                    .includes(
                        searchText
                    );


            return (
                categoryMatch &&
                searchMatch
            );

        }
    );

}


/* =========================================================
   RENDER PRODUCTS
========================================================= */

function renderProducts() {

    if (!productsGrid) {
        return;
    }


    const products =
        getFilteredProducts();


    productsGrid.innerHTML =
        "";


    if (productsResultCount) {

        productsResultCount.textContent =
            `${products.length} منتج`;

    }


    if (!products.length) {

        if (productsEmpty) {

            productsEmpty.hidden =
                false;

        }

        return;

    }


    if (productsEmpty) {

        productsEmpty.hidden =
            true;

    }


    products.forEach(
        (
            product,
            index
        ) => {

            const card =
                createProductCard(
                    product,
                    index
                );


            productsGrid.appendChild(
                card
            );

        }
    );


    revealProducts();

}


/* =========================================================
   CREATE PRODUCT CARD
========================================================= */

function createProductCard(
    product,
    index
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
    "product-card";


// التحقق من المخزون
const stockQuantity =
    Number(product.stock_quantity || 0);

const isOutOfStock =
    stockQuantity <= 0;


// إذا المنتج غير متوفر
if (isOutOfStock) {

    card.classList.add(
        "out-of-stock"
    );

}


// المنتج المميز
if (product.is_featured) {

    card.classList.add(
        "featured"
    );

}


    /* =====================================================
       PRODUCT IMAGE
    ===================================================== */

    const image =
        product.image_url ||
        "https://placehold.co/800x1000/eeeae4/063d39?text=OUDANA";


    /* =====================================================
       RATING
    ===================================================== */

    const rating =
        Number(
            product.rating || 0
        );


    const stars =
        createStars(
            rating
        );


    /* =====================================================
       CARD HTML
    ===================================================== */

    card.innerHTML = `

        <div class="product-image product-slideshow">

            ${
                product.is_featured
                    ? `
                        <span class="bestseller">
                            مميز
                        </span>
                    `
                    : ""
            }


            <button
                class="wishlist"
                type="button"
                aria-label="إضافة للمفضلة"
                aria-pressed="false"
                title="إضافة للمفضلة"
            >

                <i class="fa-regular fa-heart"></i>

            </button>


            <div class="product-slides">

                <img
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(
                        product.name || "منتج"
                    )}"
                    loading="lazy"
                >

            </div>


            <div class="product-overlay">
    ${
        isOutOfStock
            ? `
                <button
                    type="button"
                    class="add-to-cart-btn out-of-stock-btn"
                    disabled
                >
                    <i class="fa-regular fa-bell"></i>
                    أبلغيني عند توفره
                </button>
            `
            : `
                <button
                    type="button"
                    class="add-to-cart-btn"
                >
                    <i class="fa-solid fa-bag-shopping"></i>
                    أضيفي إلى السلة
                </button>
            `
    }
</div>

        </div>


        <div class="product-info">

            <span class="product-category">

                ${escapeHTML(
                    product.category ||
                    "OUDANA"
                )}

            </span>


            <h3>

                ${escapeHTML(
                    product.name ||
                    "منتج"
                )}

            </h3>


            <div class="product-bottom">

                <span class="price">

                    ${formatPrice(
                        product.price
                    )}

                    <small>
                        ر.س
                    </small>

                </span>


                <span
                    class="stars"
                    aria-label="التقييم ${rating}"
                >

                    ${stars}

                </span>

            </div>

        </div>

    `;


    /* =====================================================
       PRODUCT CARD CLICK
    ===================================================== */

    card.addEventListener(
        "click",
        () => {

            window.location.href =
                `product.html?id=${encodeURIComponent(
                    product.id
                )}`;

        }
    );


    /* =====================================================
       WISHLIST BUTTON
    ===================================================== */

    const wishlist =
        card.querySelector(
            ".wishlist"
        );


    if (wishlist) {

        initializeFavoriteButton(
            product.id,
            wishlist
        );

    }


    /* =====================================================
       ADD TO CART BUTTON
    ===================================================== */

    const addToCartButton =
        card.querySelector(
            ".add-to-cart-btn"
        );


    if (addToCartButton) {

        addToCartButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();


                addToCart(
                    product,
                    addToCartButton
                );

            }
        );

    }


    return card;

}


/* =========================================================
   FAVORITES
========================================================= */


/* =========================================================
   GET CURRENT USER
========================================================= */

async function getCurrentUser() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getUser();


        if (error) {

            console.error(
                "User error:",
                error
            );

            return null;

        }


        return data?.user || null;


    } catch (error) {

        console.error(
            "Get current user error:",
            error
        );

        return null;

    }

}


/* =========================================================
   GET FAVORITE
========================================================= */

async function getFavorite(
    userId,
    productId
) {

    const {
        data,
        error
    } =
        await supabaseClient

            .from("favorites")

            .select("id")

            .eq(
                "user_id",
                userId
            )

            .eq(
                "product_id",
                productId
            )

            .maybeSingle();


    if (error) {

        throw error;

    }


    return data || null;

}


/* =========================================================
   CHECK FAVORITE
========================================================= */

async function isFavorite(
    productId
) {

    const user =
        await getCurrentUser();


    if (!user) {

        return false;

    }


    const favorite =
        await getFavorite(
            user.id,
            productId
        );


    return !!favorite;

}


/* =========================================================
   UPDATE FAVORITE BUTTON
========================================================= */

function updateFavoriteButton(
    button,
    liked
) {

    if (!button) {
        return;
    }


    button.classList.toggle(
        "liked",
        liked
    );


    button.setAttribute(
        "aria-pressed",
        liked
            ? "true"
            : "false"
    );


    button.setAttribute(
        "aria-label",
        liked
            ? "إزالة من المفضلة"
            : "إضافة للمفضلة"
    );


    button.setAttribute(
        "title",
        liked
            ? "إزالة من المفضلة"
            : "إضافة للمفضلة"
    );


    const icon =
        button.querySelector(
            "i"
        );


    if (icon) {

        icon.className =
            liked
                ? "fa-solid fa-heart"
                : "fa-regular fa-heart";

    }

}


/* =========================================================
   INITIALIZE FAVORITE BUTTON
========================================================= */

async function initializeFavoriteButton(
    productId,
    button
) {

    if (!button) {
        return;
    }


    if (
        button.dataset.favoriteInitialized ===
        "true"
    ) {

        return;

    }


    button.dataset.favoriteInitialized =
        "true";


    /* =====================================================
       GET CURRENT FAVORITE STATE
    ===================================================== */

    try {

        const liked =
            await isFavorite(
                productId
            );


        updateFavoriteButton(
            button,
            liked
        );


    } catch (error) {

        console.error(
            "Favorite state error:",
            error
        );

    }


    /* =====================================================
       CLICK
    ===================================================== */

    button.addEventListener(
        "click",
        async event => {

            event.preventDefault();

            event.stopPropagation();


            await toggleFavorite(
                productId,
                button
            );

        }
    );

}


/* =========================================================
   TOGGLE FAVORITE
========================================================= */

async function toggleFavorite(
    productId,
    button
) {

    if (!button) {
        return;
    }


    /* =====================================================
       CHECK LOGIN
    ===================================================== */

    const user =
        await getCurrentUser();


    if (!user) {

        alert(
            "سجلي الدخول أولًا لإضافة المنتجات إلى المفضلة."
        );

        return;

    }


    /* =====================================================
       PREVENT DOUBLE CLICK
    ===================================================== */

    if (button.disabled) {
        return;
    }


    button.disabled = true;


    try {

        const favorite =
            await getFavorite(
                user.id,
                productId
            );


        /* =================================================
           REMOVE
        ================================================= */

        if (favorite) {

            const {
                error
            } =
                await supabaseClient

                    .from("favorites")

                    .delete()

                    .eq(
                        "id",
                        favorite.id
                    );


            if (error) {

                throw error;

            }


            updateFavoriteButton(
                button,
                false
            );


            console.log(
                "Removed from favorites:",
                productId
            );

        }


        /* =================================================
           ADD
        ================================================= */

        else {

            const {
                error
            } =
                await supabaseClient

                    .from("favorites")

                    .insert({

                        user_id:
                            user.id,

                        product_id:
                            productId

                    });


            if (error) {

                throw error;

            }


            updateFavoriteButton(
                button,
                true
            );


            console.log(
                "Added to favorites:",
                productId
            );

        }


    } catch (error) {

        console.error(
            "Favorite error:",
            error
        );


        alert(
            "حدث خطأ أثناء تحديث المفضلة."
        );

    } finally {

        button.disabled =
            false;

    }

}


/* =========================================================
   ADD TO CART
========================================================= */

function addToCart(
    product,
    button
) {

    if (
        typeof addProductToSharedCart !==
        "function"
    ) {

        console.error(
            "addProductToSharedCart is not defined"
        );

        return;

    }


    addProductToSharedCart(
        product,
        1
    );


    updateCartCount();


    const original =
        button.innerHTML;


    button.classList.add(
        "added"
    );


    button.innerHTML = `

        <i class="fa-solid fa-check"></i>

        تمت الإضافة

    `;


    setTimeout(
        () => {

            button.classList.remove(
                "added"
            );


            button.innerHTML =
                original;

        },
        1200
    );

}


/* =========================================================
   CREATE STARS
========================================================= */

function createStars(
    rating
) {

    const rounded =
        Math.round(
            Number(rating) || 0
        );


    let html = "";


    for (
        let i = 1;
        i <= 5;
        i++
    ) {

        html +=
            i <= rounded
                ? "★"
                : "☆";

    }


    return html;

}


/* =========================================================
   FORMAT PRICE
========================================================= */

function formatPrice(
    price
) {

    return Number(
        price || 0
    )
        .toLocaleString(
            "ar-SA",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        );

}


/* =========================================================
   SEARCH
========================================================= */

if (productSearch) {

    productSearch.addEventListener(
        "input",
        event => {

            currentSearch =
                event.target.value;


            renderProducts();

        }
    );

}


/* =========================================================
   SEARCH OVERLAY
========================================================= */

const searchBtn =
    document.getElementById(
        "searchBtn"
    );


const searchOverlay =
    document.getElementById(
        "searchOverlay"
    );


const searchClose =
    document.getElementById(
        "searchClose"
    );


if (searchBtn) {

    searchBtn.addEventListener(
        "click",
        () => {

            if (!searchOverlay) {
                return;
            }


            searchOverlay.classList.add(
                "open"
            );


            document.body.classList.add(
                "no-scroll"
            );


            setTimeout(
                () => {

                    productSearch?.focus();

                },
                300
            );

        }
    );

}


if (searchClose) {

    searchClose.addEventListener(
        "click",
        closeSearch
    );

}


function closeSearch() {

    if (searchOverlay) {

        searchOverlay.classList.remove(
            "open"
        );

    }


    document.body.classList.remove(
        "no-scroll"
    );

}


/* =========================================================
   REALTIME PRODUCTS
========================================================= */

function subscribeToProducts() {

    const channel =
        supabaseClient

            .channel(
                "oudana-products-realtime"
            )

            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "products"
                },
                payload => {

                    console.log(
                        "Product change:",
                        payload
                    );


                    loadProducts();

                }
            )

            .subscribe(
                status => {

                    console.log(
                        "Products realtime:",
                        status
                    );

                }
            );


    return channel;

}


/* =========================================================
   LOADING
========================================================= */

function showLoading() {

    if (productsLoading) {

        productsLoading.style.display =
            "flex";

    }


    if (productsEmpty) {

        productsEmpty.hidden =
            true;

    }

}


function hideLoading() {

    if (productsLoading) {

        productsLoading.style.display =
            "none";

    }

}


/* =========================================================
   PRODUCTS ERROR
========================================================= */

function showProductsError() {

    if (!productsGrid) {
        return;
    }


    productsGrid.innerHTML = `

        <div class="products-error">

            <i class="fa-solid fa-circle-exclamation"></i>

            <h3>
                تعذر تحميل المنتجات
            </h3>

            <p>
                حدث خطأ أثناء الاتصال بالمنتجات.
                حاولي مرة أخرى.
            </p>

            <button
                class="dark-btn"
                type="button"
                onclick="loadProducts()"
            >

                إعادة المحاولة

            </button>

        </div>

    `;

}


/* =========================================================
   REVEAL ANIMATION
========================================================= */

function revealProducts() {

    requestAnimationFrame(
        () => {

            document
                .querySelectorAll(
                    ".product-card"
                )
                .forEach(
                    (
                        card,
                        index
                    ) => {

                        setTimeout(
                            () => {

                                card.classList.add(
                                    "revealed"
                                );

                            },
                            index * 70
                        );

                    }
                );

        }
    );

}


/* =========================================================
   MOBILE MENU
========================================================= */

const mobileMenuBtn =
    document.getElementById(
        "mobileMenuBtn"
    );


const mobileMenu =
    document.getElementById(
        "mobileMenu"
    );


const mobileMenuClose =
    document.getElementById(
        "mobileMenuClose"
    );


mobileMenuBtn?.addEventListener(
    "click",
    () => {

        mobileMenu?.classList.add(
            "open"
        );


        document.body.classList.add(
            "no-scroll"
        );

    }
);


mobileMenuClose?.addEventListener(
    "click",
    () => {

        mobileMenu?.classList.remove(
            "open"
        );


        document.body.classList.remove(
            "no-scroll"
        );

    }
);


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )

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
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadProducts();

        subscribeToProducts();

        updateCartCount();

    }
);


/* =========================================================
   HEADER SCROLL EFFECT
========================================================= */

const header =
    document.querySelector(
        ".header"
    );


window.addEventListener(
    "scroll",
    () => {

        if (!header) {
            return;
        }


        if (window.scrollY > 50) {

            header.classList.add(
                "scrolled"
            );

        } else {

            header.classList.remove(
                "scrolled"
            );

        }

    }
);