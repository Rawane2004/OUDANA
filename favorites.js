/* =========================================================
   OUDANA — FAVORITES
   Favorites page + Supabase
========================================================= */

const SUPABASE_URL = "https://gpncttjpcucnbaatwjoy.supabase.co";
const SUPABASE_KEY = "sb_publishable_emYCVcv_b9gLa62n3D1pPg_lI5xRnD4";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* =========================================================
   DOM
========================================================= */

const favoritesContent =
    document.getElementById("favoritesContent");


/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    await loadFavorites();

});


/* =========================================================
   LOAD FAVORITES
========================================================= */

async function loadFavorites() {

    if (!favoritesContent) return;

    favoritesContent.innerHTML = `
        <div class="favorites-empty">

            <i class="fa-solid fa-spinner fa-spin"></i>

            <p>
                جاري تحميل المفضلة...
            </p>

        </div>
    `;


    try {

        /* -----------------------------------------
           Get logged-in user
        ----------------------------------------- */

        const {
            data: {
                user
            },
            error: userError
        } = await supabaseClient.auth.getUser();


        if (userError) {
            throw userError;
        }


        /* -----------------------------------------
           User not logged in
        ----------------------------------------- */

        if (!user) {

            showEmptyFavorites(
                "سجّلي الدخول أولًا",
                "يجب تسجيل الدخول حتى تتمكني من حفظ المنتجات في المفضلة."
            );

            return;
        }


        /* -----------------------------------------
           Get favorites + products
        ----------------------------------------- */

        const {
            data,
            error
        } = await supabaseClient

            .from("favorites")

            .select(`
                id,
                user_id,
                product_id,
                created_at,
                products (
                    id,
                    name,
                    description,
                    category,
                    price,
                    image_url,
                    rating,
                    sales_count,
                    is_available,
                    is_featured
                )
            `)

            .eq("user_id", user.id)

            .order("created_at", {
                ascending: false
            });


        if (error) {
            throw error;
        }


        console.log(
            "Favorites loaded:",
            data
        );


        /* -----------------------------------------
           No favorites
        ----------------------------------------- */

        if (!data || data.length === 0) {

            showEmptyFavorites(
                "مفضلتك فارغة",
                "لم تقومي بإضافة أي منتجات إلى المفضلة بعد."
            );

            return;
        }


        /* -----------------------------------------
           Render favorites
        ----------------------------------------- */

        renderFavorites(data);


    } catch (error) {

        console.error(
            "Error loading favorites:",
            error
        );


        favoritesContent.innerHTML = `
            <div class="favorites-empty">

                <i class="fa-solid fa-heart-crack"></i>

                <h2>
                    حدث خطأ
                </h2>

                <p>
                    لم نتمكن من تحميل المفضلة حاليًا.
                </p>

                <button
                    type="button"
                    onclick="loadFavorites()"
                    style="
                        border:none;
                        cursor:pointer;
                        background:var(--emerald);
                        color:white;
                        padding:13px 22px;
                        border-radius:12px;
                        font-family:inherit;
                    "
                >
                    المحاولة مرة أخرى
                </button>

            </div>
        `;
    }
}


/* =========================================================
   RENDER FAVORITES
========================================================= */

function renderFavorites(favorites) {

    if (!favoritesContent) return;


    favoritesContent.innerHTML = `

        <div class="favorites-grid">

            ${favorites.map(favorite => {

                const product = favorite.products;

                if (!product) {
                    return "";
                }


                return createFavoriteCard(
                    favorite,
                    product
                );

            }).join("")}

        </div>

    `;
}


/* =========================================================
   CREATE FAVORITE CARD
========================================================= */
/* =========================================================
   CREATE FAVORITE CARD
   نفس تصميم كروت الصفحة الرئيسية
========================================================= */

function createFavoriteCard(
    favorite,
    product
) {

    const image =
        product.image_url ||
        "https://placehold.co/800x1000/eeeae4/063d39?text=OUDANA";


    const rating =
        Number(product.rating || 0);


    const price =
        Number(product.price || 0)
            .toLocaleString("ar-SA", {
                maximumFractionDigits: 2
            });


    const stars =
        Array.from(
            { length: 5 },
            (_, index) => {

                if (index + 1 <= Math.round(rating)) {

                    return `
                        <i class="fa-solid fa-star"></i>
                    `;

                }

                return `
                    <i class="fa-regular fa-star"></i>
                `;

            }
        ).join("");


    return `

       <article
    class="product-card favorite-product-card"
    data-favorite-id="${favorite.id}"
    data-product-id="${product.id}"
    data-product-url="product.html?id=${encodeURIComponent(product.id)}"
>

            <!-- صورة المنتج -->

            <div class="product-image">

                ${
                    product.is_featured
                        ? `
                            <span class="bestseller">
                                مميز
                            </span>
                        `
                        : ""
                }


                <!-- القلب -->

                <button
                    type="button"
                    class="wishlist liked remove-favorite"
                    data-favorite-id="${favorite.id}"
                    data-product-id="${product.id}"
                    aria-label="إزالة من المفضلة"
                    aria-pressed="true"
                    title="إزالة من المفضلة"
                >

                    <i class="fa-solid fa-heart"></i>

                </button>


                <!-- الصورة -->

                <div class="product-slides">

                    <img
                        src="${escapeHTML(image)}"
                        alt="${escapeHTML(
                            product.name || "منتج"
                        )}"
                        loading="lazy"
                    >

                </div>


                <!-- زر عرض المنتج -->

                <div class="product-overlay">

                    <a
                        href="product.html?id=${encodeURIComponent(product.id)}"
                        class="favorite-view-btn"
                    >

                        عرض المنتج

                        <i class="fa-solid fa-arrow-left"></i>

                    </a>

                </div>

            </div>


            <!-- معلومات المنتج -->

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

                        ${price}

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

        </article>

    `;
}

/* =========================================================
   REMOVE FAVORITE
========================================================= */

document.addEventListener(
    "click",
    async (event) => {

        const button =
            event.target.closest(
                ".remove-favorite"
            );


        if (!button) return;


        const favoriteId =
            button.dataset.favoriteId;


        const productId =
            button.dataset.productId;


        if (!favoriteId || !productId) {
            return;
        }


        await removeFavorite(
            favoriteId,
            productId,
            button
        );

    }
);


/* =========================================================
   REMOVE FAVORITE FROM SUPABASE
========================================================= */

async function removeFavorite(
    favoriteId,
    productId,
    button
) {

    try {

        button.disabled = true;


        const {
            error
        } = await supabaseClient

            .from("favorites")

            .delete()

            .eq("id", favoriteId);


        if (error) {
            throw error;
        }


        /* -----------------------------------------
           Remove card visually
        ----------------------------------------- */

        const card =
    document.querySelector(
        `.favorite-product-card[data-favorite-id="${favoriteId}"]`
    );


        if (card) {

            card.style.opacity = "0";
            card.style.transform = "scale(.96)";


            setTimeout(() => {

                card.remove();


                const remaining =
    document.querySelectorAll(
        ".favorite-product-card"
    );


                if (remaining.length === 0) {

                    showEmptyFavorites(
                        "مفضلتك فارغة",
                        "لم تقومي بإضافة أي منتجات إلى المفضلة بعد."
                    );

                }

            }, 250);
        }


        console.log(
            "Favorite removed:",
            productId
        );


    } catch (error) {

        console.error(
            "Error removing favorite:",
            error
        );


        button.disabled = false;


        alert(
            "حدث خطأ أثناء إزالة المنتج من المفضلة."
        );

    }
}


/* =========================================================
   EMPTY FAVORITES
========================================================= */

function showEmptyFavorites(
    title,
    message
) {

    favoritesContent.innerHTML = `

        <div class="favorites-empty">

            <i class="fa-regular fa-heart"></i>

            <h2>
                ${escapeHTML(title)}
            </h2>

            <p>
                ${escapeHTML(message)}
            </p>

            <a href="menu.html">

                اكتشفي المنتجات

                <i class="fa-solid fa-arrow-left"></i>

            </a>

        </div>

    `;
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}




/* =========================================================
   FAVORITE PRODUCT CARD — OPEN PRODUCT
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const card =
            event.target.closest(
                ".favorite-product-card"
            );

        if (!card) return;


        // لا نفتح المنتج عند الضغط على القلب

        if (
            event.target.closest(
                ".remove-favorite"
            )
        ) {
            return;
        }


        // لا نكرر الرابط إذا ضغط على زر عرض المنتج

        if (
            event.target.closest(
                ".favorite-view-btn"
            )
        ) {
            return;
        }


        const url =
            card.dataset.productUrl;

        if (url) {

            window.location.href = url;

        }

    }
);