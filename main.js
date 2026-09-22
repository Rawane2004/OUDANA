/* =========================================================
   OUDANA ADMIN PANEL
   Supabase + Secure Admin Auth + Products + Orders
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
   DOM ELEMENTS
========================================================= */

const addProductBtn =
    document.getElementById("addProductBtn");

const productModalBackdrop =
    document.getElementById("productModalBackdrop");

const closeProductModalBtn =
    document.getElementById("closeProductModal");

const cancelProductBtn =
    document.getElementById("cancelProductBtn");

const productForm =
    document.getElementById("productForm");

const saveProductBtn =
    document.getElementById("saveProductBtn");

const productFormMessage =
    document.getElementById("productFormMessage");

const productsGrid =
    document.getElementById("productsGrid");

const productImageInput =
    document.getElementById("productImage");

const productImagePreview =
    document.getElementById("productImagePreview");


/* =========================================================
   ADMIN AUTH
========================================================= */

let currentAdmin = null;


/* =========================================================
   LOGIN SCREEN
========================================================= */

function createLoginScreen() {

    if (document.getElementById("oudanaAdminLogin")) {
        return;
    }

    const loginScreen =
        document.createElement("div");

    loginScreen.id =
        "oudanaAdminLogin";

    loginScreen.innerHTML = `

        <div style="
            position:fixed;
            inset:0;
            z-index:99999;
            background:#f7f2e9;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
            direction:rtl;
            font-family:'IBM Plex Sans Arabic',sans-serif;
        ">

            <div style="
                width:100%;
                max-width:430px;
                background:#fff;
                border-radius:24px;
                padding:35px 30px;
                box-shadow:0 20px 60px rgba(0,0,0,.12);
            ">

                <div style="
                    text-align:center;
                    margin-bottom:28px;
                ">

                    <div style="
                        font-family:'Aref Ruqaa',serif;
                        font-size:42px;
                        color:#063d39;
                        margin-bottom:5px;
                    ">
                        عودانا
                    </div>

                    <div style="
                        color:#7c746b;
                        font-size:14px;
                    ">
                        تسجيل الدخول إلى لوحة الإدارة
                    </div>

                </div>

                <form id="oudanaLoginForm">

                    <div style="margin-bottom:16px;">

                        <label style="
                            display:block;
                            margin-bottom:8px;
                            font-size:14px;
                            color:#302b27;
                        ">
                            البريد الإلكتروني
                        </label>

                        <input
                            id="oudanaLoginEmail"
                            type="email"
                            autocomplete="email"
                            required
                            placeholder="البريد الإلكتروني"
                            style="
                                width:100%;
                                box-sizing:border-box;
                                border:1px solid #e5dfd7;
                                border-radius:12px;
                                padding:13px 14px;
                                font-family:inherit;
                                font-size:14px;
                                outline:none;
                            "
                        >

                    </div>

                    <div style="margin-bottom:18px;">

                        <label style="
                            display:block;
                            margin-bottom:8px;
                            font-size:14px;
                            color:#302b27;
                        ">
                            كلمة المرور
                        </label>

                        <input
                            id="oudanaLoginPassword"
                            type="password"
                            autocomplete="current-password"
                            required
                            placeholder="كلمة المرور"
                            style="
                                width:100%;
                                box-sizing:border-box;
                                border:1px solid #e5dfd7;
                                border-radius:12px;
                                padding:13px 14px;
                                font-family:inherit;
                                font-size:14px;
                                outline:none;
                            "
                        >

                    </div>

                    <div
                        id="oudanaLoginMessage"
                        style="
                            display:none;
                            margin-bottom:15px;
                            padding:11px 13px;
                            border-radius:10px;
                            font-size:13px;
                            line-height:1.7;
                        "
                    ></div>

                    <button
                        id="oudanaLoginButton"
                        type="submit"
                        style="
                            width:100%;
                            border:0;
                            border-radius:12px;
                            padding:14px;
                            background:#063d39;
                            color:#fff;
                            font-family:inherit;
                            font-size:15px;
                            cursor:pointer;
                        "
                    >
                        دخول لوحة الإدارة
                    </button>

                </form>

            </div>

        </div>

    `;

    document.body.appendChild(
        loginScreen
    );

    const loginForm =
        document.getElementById(
            "oudanaLoginForm"
        );

    loginForm?.addEventListener(
        "submit",
        handleAdminLogin
    );
}


/* =========================================================
   LOGIN
========================================================= */

async function handleAdminLogin(event) {

    event.preventDefault();

    const email =
        document
            .getElementById(
                "oudanaLoginEmail"
            )
            ?.value
            .trim();

    const password =
        document
            .getElementById(
                "oudanaLoginPassword"
            )
            ?.value;

    const button =
        document.getElementById(
            "oudanaLoginButton"
        );

    if (!email || !password) {

        showLoginMessage(
            "أدخل البريد الإلكتروني وكلمة المرور.",
            "error"
        );

        return;
    }

    if (button) {

        button.disabled = true;

        button.textContent =
            "جاري تسجيل الدخول...";
    }

    try {

        const {
            data,
            error
        } = await supabaseClient.auth.signInWithPassword({

            email,
            password

        });

        if (error) {
            throw error;
        }

        if (!data?.user) {

            throw new Error(
                "تعذر الحصول على بيانات المستخدم."
            );
        }


        const {
            data: isAdmin,
            error: rpcError
        } = await supabaseClient
            .rpc("is_admin");

        if (rpcError) {

            await supabaseClient.auth.signOut();

            throw rpcError;
        }

        if (isAdmin !== true) {

            await supabaseClient.auth.signOut();

            throw new Error(
                "هذا الحساب ليس لديه صلاحية أدمن."
            );
        }


        currentAdmin =
            data.user;

        hideLoginScreen();

        await initializeAdmin();

    }
    catch (error) {

        console.error(
            "Admin login error:",
            error
        );

        showLoginMessage(
            getFriendlyAuthError(error),
            "error"
        );

    }
    finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "دخول لوحة الإدارة";
        }
    }
}


/* =========================================================
   LOGIN MESSAGE
========================================================= */

function showLoginMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "oudanaLoginMessage"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.style.display =
        "block";

    if (type === "error") {

        element.style.background =
            "#fff1f0";

        element.style.color =
            "#b42318";

    }
    else {

        element.style.background =
            "#edf8f2";

        element.style.color =
            "#18794e";
    }
}


/* =========================================================
   FRIENDLY AUTH ERRORS
========================================================= */

function getFriendlyAuthError(error) {

    const message =
        String(
            error?.message || ""
        );

    if (
        message.includes(
            "Invalid login credentials"
        )
    ) {

        return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    }

    if (
        message.includes(
            "Email not confirmed"
        )
    ) {

        return "يجب تأكيد البريد الإلكتروني لحساب الأدمن من Supabase.";
    }

    if (
        message.includes(
            "not have permission"
        ) ||
        message.includes(
            "row-level security"
        )
    ) {

        return "الحساب ليس لديه صلاحية الأدمن في قاعدة البيانات.";
    }

    if (
        message.includes("JWT") ||
        message.includes("session")
    ) {

        return "انتهت جلسة الدخول. سجّل الدخول مرة أخرى.";
    }

    return (
        message ||
        "حدث خطأ أثناء تسجيل الدخول."
    );
}


/* =========================================================
   HIDE LOGIN
========================================================= */

function hideLoginScreen() {

    const screen =
        document.getElementById(
            "oudanaAdminLogin"
        );

    if (screen) {
        screen.remove();
    }
}


/* =========================================================
   ADMIN SESSION CHECK
========================================================= */

async function checkAdminSession() {

    const {
        data,
        error
    } =
        await supabaseClient.auth.getUser();


    if (
        error ||
        !data?.user
    ) {

        createLoginScreen();

        return false;
    }


    const {
        data: isAdmin,
        error: adminError
    } =
        await supabaseClient
            .rpc("is_admin");


    if (
        adminError ||
        isAdmin !== true
    ) {

        window.location.href =
            "index.html";

        return false;
    }


    currentAdmin =
        data.user;

    return true;
}


/* =========================================================
   SIDE MENU
========================================================= */

const openMenu =
    document.getElementById("openMenu");

const closeMenu =
    document.getElementById("closeMenu");

const menuBackdrop =
    document.getElementById("menuBackdrop");


function openSideMenu() {

    document.body.classList.add(
        "menu-open"
    );
}


function closeSideMenu() {

    document.body.classList.remove(
        "menu-open"
    );
}


openMenu?.addEventListener(
    "click",
    openSideMenu
);

closeMenu?.addEventListener(
    "click",
    closeSideMenu
);

menuBackdrop?.addEventListener(
    "click",
    closeSideMenu
);


/* =========================================================
   ADMIN PAGES
========================================================= */

const adminPages = {

    dashboard:
        document.getElementById("dashboardPage"),

    products:
        document.getElementById("productsPage"),

    orders:
        document.getElementById("ordersPage"),

    customers:
        document.getElementById("customersPage"),

    complaints:
        document.getElementById("complaintsPage"),

    statistics:
        document.getElementById("statisticsPage"),

    settings:
        document.getElementById("settingsPage")

};


const sideNavLinks =
    document.querySelectorAll(
        ".side-nav a[data-page]"
    );


function showAdminPage(pageName) {

    Object.values(adminPages).forEach(
        page => {

            if (page) {

                page.classList.add(
                    "is-hidden"
                );
            }
        }
    );

    const selectedPage =
        adminPages[pageName];

    if (selectedPage) {

        selectedPage.classList.remove(
            "is-hidden"
        );
    }

    sideNavLinks.forEach(
        link => {

            link.classList.toggle(
                "active",
                link.dataset.page === pageName
            );

        }
    );

    closeSideMenu();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   NAVIGATION
========================================================= */

sideNavLinks.forEach(
    link => {

        link.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                showAdminPage(
                    this.dataset.page
                );

            }
        );

    }
);


document
    .querySelectorAll(".section-link")
    .forEach(
        link => {

            link.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    const text =
                        this.textContent.trim();

                    if (
                        text.includes("عرض الكل")
                    ) {

                        showAdminPage(
                            "orders"
                        );

                    }
                    else if (
                        text.includes(
                            "إدارة المنتجات"
                        )
                    ) {

                        showAdminPage(
                            "products"
                        );
                    }

                }
            );

        }
    );


/* =========================================================
   ESC
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key !== "Escape") {
            return;
        }

        closeSideMenu();

        if (
            productModalBackdrop &&
            productModalBackdrop.classList.contains(
                "open"
            )
        ) {

            closeProductModal();
        }

    }
);


/* =========================================================
   STATISTICS PERIOD
========================================================= */

document
    .querySelectorAll(".stats-period-btn")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    document
                        .querySelectorAll(
                            ".stats-period-btn"
                        )
                        .forEach(
                            item => {

                                item.classList.remove(
                                    "active"
                                );

                            }
                        );

                    this.classList.add(
                        "active"
                    );

                }
            );

        }
    );


/* =========================================================
   PRODUCT MODAL
========================================================= */

function openProductModal() {

    if (!productForm) {
        return;
    }

    productForm.reset();

    delete productForm.dataset.editingId;

    const available =
        document.getElementById(
            "productAvailable"
        );

    const featured =
        document.getElementById(
            "productFeatured"
        );

    const rating =
        document.getElementById(
            "productRating"
        );

    const salesCount =
        document.getElementById(
            "productSalesCount"
        );
        const productStock =
    document.getElementById(
        "productStock"
    );

    if (available) {
        available.checked = true;
    }

    if (featured) {
        featured.checked = false;
    }

    if (rating) {
        rating.value = "0";
    }

    if (salesCount) {
        salesCount.value = "0";
    }

    if (productStock) {
    productStock.value = "0";
}

    if (productFormMessage) {

        productFormMessage.textContent =
            "";

        productFormMessage.className =
            "product-form-message";
    }

    if (productImageInput) {
        productImageInput.value = "";
    }

    if (productImagePreview) {

        productImagePreview.innerHTML =
            "";
    }

    const modalTitle =
        productModalBackdrop?.querySelector(
            ".product-modal-header h2"
        );

    if (modalTitle) {

        modalTitle.textContent =
            "إضافة منتج";
    }

    const modalDescription =
        productModalBackdrop?.querySelector(
            ".product-modal-header p"
        );

    if (modalDescription) {

        modalDescription.textContent =
            "أدخلي بيانات المنتج ثم احفظيه في المتجر.";
    }

    if (saveProductBtn) {

        saveProductBtn.textContent =
            "حفظ المنتج";
    }

    productModalBackdrop?.classList.add(
        "open"
    );

    setTimeout(
        () => {

            document
                .getElementById(
                    "productName"
                )
                ?.focus();

        },
        150
    );
}


function closeProductModal() {

    productModalBackdrop?.classList.remove(
        "open"
    );
}


addProductBtn?.addEventListener(
    "click",
    openProductModal
);

closeProductModalBtn?.addEventListener(
    "click",
    closeProductModal
);

cancelProductBtn?.addEventListener(
    "click",
    closeProductModal
);

productModalBackdrop?.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            productModalBackdrop
        ) {

            closeProductModal();
        }

    }
);


/* =========================================================
   IMAGE PREVIEW
========================================================= */

productImageInput?.addEventListener(
    "change",
    function () {

        if (!productImagePreview) {
            return;
        }

        productImagePreview.innerHTML =
            "";

        const file =
            this.files?.[0];

        if (!file) {
            return;
        }

        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            productImagePreview.innerHTML =
                "<span>الملف المختار ليس صورة.</span>";

            this.value = "";

            return;
        }

        if (
            file.size >
            5 * 1024 * 1024
        ) {

            productImagePreview.innerHTML =
                "<span>حجم الصورة يجب ألا يتجاوز 5MB.</span>";

            this.value = "";

            return;
        }

        const image =
            document.createElement(
                "img"
            );

        image.src =
            URL.createObjectURL(
                file
            );

        image.alt =
            "معاينة صورة المنتج";

        image.onload =
            () => {

                URL.revokeObjectURL(
                    image.src
                );

            };

        productImagePreview.appendChild(
            image
        );

    }
);


/* =========================================================
   PRODUCT MESSAGE
========================================================= */

function showProductMessage(
    message,
    type = ""
) {

    if (!productFormMessage) {
        return;
    }

    productFormMessage.textContent =
        message;

    productFormMessage.className =
        "product-form-message";

    if (type) {

        productFormMessage.classList.add(
            type
        );
    }
}


/* =========================================================
   GET PRODUCT FORM DATA
========================================================= */

function getProductFormData() {

    const name =
        document
            .getElementById(
                "productName"
            )
            ?.value
            .trim();

    const description =
        document
            .getElementById(
                "productDescription"
            )
            ?.value
            .trim() || null;

    const category =
        document
            .getElementById(
                "productCategory"
            )
            ?.value;

    const price =
        Number(
            document
                .getElementById(
                    "productPrice"
                )
                ?.value
        );

    

    const sales_count =
        Number(
            document
                .getElementById(
                    "productSalesCount"
                )
                ?.value || 0
        );

        const stock_quantity =
        Number(
            document
            .getElementById("productStock")
            ?.value || 0
        );

    const is_available =
        document
            .getElementById(
                "productAvailable"
            )
            ?.checked ?? true;

    const is_featured =
        document
            .getElementById(
                "productFeatured"
            )
            ?.checked ?? false;

    return {

    name,
    description,
    category,
    price,
    sales_count,
    stock_quantity,
    is_available,
    is_featured

};
}


/* =========================================================
   VALIDATE PRODUCT
========================================================= */

function validateProductData(data) {

    if (!data.name) {

        return "اكتبي اسم المنتج أولًا.";
    }

    if (!data.category) {

        return "اختاري تصنيف المنتج.";
    }

    if (
        !Number.isFinite(data.price) ||
        data.price < 0
    ) {

        return "أدخلي سعرًا صحيحًا.";
    }

   

    if (
        !Number.isInteger(
            data.sales_count
        ) ||
        data.sales_count < 0
    ) {

        return "عدد المبيعات يجب أن يكون رقمًا صحيحًا.";
    }

    if (
    !Number.isInteger(
        data.stock_quantity
    ) ||
    data.stock_quantity < 0
) {

    return "الكمية المتوفرة يجب أن تكون رقمًا صحيحًا.";
}

    return null;
}


/* =========================================================
   UPLOAD PRODUCT IMAGE
========================================================= */

async function uploadProductImage(
    imageFile
) {

    if (!imageFile) {
        return null;
    }

    if (
        !imageFile.type.startsWith(
            "image/"
        )
    ) {

        throw new Error(
            "الملف المختار ليس صورة."
        );
    }

    if (
        imageFile.size >
        5 * 1024 * 1024
    ) {

        throw new Error(
            "حجم الصورة يجب ألا يتجاوز 5MB."
        );
    }

    const extension =
        imageFile.name
            .split(".")
            .pop()
            .toLowerCase();

    const allowedExtensions = [
        "jpg",
        "jpeg",
        "png",
        "webp",
        "gif"
    ];

    if (
        !allowedExtensions.includes(
            extension
        )
    ) {

        throw new Error(
            "نوع الصورة غير مسموح."
        );
    }

    const fileName =
        `${crypto.randomUUID()}.${extension}`;

    const filePath =
        `products/${fileName}`;

    const {
        error: uploadError
    } = await supabaseClient
        .storage
        .from("product-images")
        .upload(
            filePath,
            imageFile,
            {
                cacheControl: "3600",
                upsert: false,
                contentType: imageFile.type
            }
        );

    if (uploadError) {

        throw uploadError;
    }

    const {
        data
    } = supabaseClient
        .storage
        .from("product-images")
        .getPublicUrl(
            filePath
        );

    return data?.publicUrl || null;
}


/* =========================================================
   SAVE PRODUCT
========================================================= */

productForm?.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const {
            data: sessionData,
            error: sessionError
        } = await supabaseClient.auth.getSession();

        if (
            sessionError ||
            !sessionData?.session
        ) {

            alert(
                "انتهت جلسة تسجيل الدخول. سجّل الدخول مرة أخرى."
            );

            await supabaseClient.auth.signOut();

            createLoginScreen();

            return;
        }


        const {
            data: isAdmin,
            error: adminError
        } = await supabaseClient
            .rpc("is_admin");

        if (
            adminError ||
            isAdmin !== true
        ) {

            alert(
                "ليس لديك صلاحية لإدارة المنتجات."
            );

            await supabaseClient.auth.signOut();

            createLoginScreen();

            return;
        }


        const formData =
            getProductFormData();

        const validationError =
            validateProductData(
                formData
            );

        if (validationError) {

            showProductMessage(
                validationError,
                "error"
            );

            return;
        }


        const editingId =
            this.dataset.editingId ||
            null;

        const imageFile =
            productImageInput
                ?.files?.[0] ||
            null;


        if (saveProductBtn) {

            saveProductBtn.disabled =
                true;

            saveProductBtn.textContent =
                editingId
                    ? "جاري التعديل..."
                    : "جاري الحفظ...";
        }

        showProductMessage(
            editingId
                ? "جاري تعديل المنتج..."
                : "جاري حفظ المنتج..."
        );


        try {

            /* =================================================
               EDIT
            ================================================= */

            if (editingId) {

                const { data: oldProduct, error: oldProductError } =
  await supabaseClient
    .from("products")
    .select("image_url, stock_quantity")
    .eq("id", editingId)
    .single();

                if (oldProductError) {
                    throw oldProductError;
                }

                let image_url =
                    oldProduct?.image_url ||
                    null;


                if (imageFile) {

                    image_url =
                        await uploadProductImage(
                            imageFile
                        );
                }


                const {
                    data,
                    error
                } = await supabaseClient
                    .from("products")
                    .update({

                        name:
                            formData.name,

                        description:
                            formData.description,

                        category:
                            formData.category,

                        price:
                            formData.price,

                        image_url:
                            image_url,

                    

                        sales_count:
                        formData.sales_count,

                    stock_quantity:
                        formData.stock_quantity,

                    is_available:
                        formData.is_available,

                        is_featured:
                            formData.is_featured

                    })
                    .eq(
                        "id",
                        editingId
                    )
                    .select()
                    .single();


                    // ========================================
// إرسال إشعارات العملاء عند عودة المخزون
// ========================================

const oldStock = Number(oldProduct?.stock_quantity ?? 0);
const newStock = Number(formData.stock_quantity ?? 0);

if (oldStock === 0 && newStock > 0) {

  try {

    const { data: notificationResult, error: notificationError } =
      await supabaseClient.functions.invoke(
        "notify-stock-available",
        {
          body: {
            product_id: editingId
          }
        }
      );

    if (notificationError) {
      console.error(
        "Stock notification error:",
        notificationError
      );
    } else {
      console.log(
    "========== STOCK NOTIFICATION RESULT =========="
);

console.log(
    JSON.stringify(
        notificationResult,
        null,
        2
    )
);

console.log(
    "==============================================="
);
    }

  } catch (notificationError) {

    console.error(
      "Stock notification invoke error:",
      notificationError
    );

  }
}

                if (error) {
                    throw error;
                }

                console.log(
                    "تم تعديل المنتج:",
                    data
                );

                showProductMessage(
                    "تم تعديل المنتج بنجاح ✓",
                    "success"
                );

            }


            /* =================================================
               ADD
            ================================================= */

            else {

                const image_url =
                    await uploadProductImage(
                        imageFile
                    );

                const {
                    data,
                    error
                } = await supabaseClient
                    .from("products")
                    .insert([
                        {

                            name:
                                formData.name,

                            description:
                                formData.description,

                            category:
                                formData.category,

                            price:
                                formData.price,

                            image_url:
                                image_url,

                            
                            sales_count:
                            formData.sales_count,

                        stock_quantity:
                            formData.stock_quantity,

                        is_available:
                            formData.is_available,

                            is_featured:
                                formData.is_featured

                        }
                    ])
                    .select()
                    .single();

                if (error) {
                    throw error;
                }

                console.log(
                    "تمت إضافة المنتج:",
                    data
                );

                showProductMessage(
                    "تمت إضافة المنتج بنجاح ✓",
                    "success"
                );
            }


            await loadProducts();


            setTimeout(
                () => {

                    closeProductModal();

                    productForm.reset();

                    delete productForm.dataset.editingId;

                    if (productImagePreview) {

                        productImagePreview.innerHTML =
                            "";
                    }

                    if (saveProductBtn) {

                        saveProductBtn.textContent =
                            "حفظ المنتج";
                    }

                },
                700
            );

        }
        catch (error) {

            console.error(
                "Product save error:",
                error
            );

            showProductMessage(
                (
                    editingId
                        ? "لم يتم تعديل المنتج: "
                        : "لم يتم حفظ المنتج: "
                ) +
                (
                    error.message ||
                    "حدث خطأ غير متوقع"
                ),
                "error"
            );

        }
        finally {

            if (saveProductBtn) {

                saveProductBtn.disabled =
                    false;

                saveProductBtn.textContent =
                    editingId
                        ? "حفظ التعديلات"
                        : "حفظ المنتج";
            }
        }

    }
);


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadProducts() {

    if (!productsGrid) {
        return;
    }

    productsGrid.innerHTML = `

        <div style="
            grid-column:1/-1;
            text-align:center;
            padding:40px;
            color:#8a8178;
        ">
            جاري تحميل المنتجات...
        </div>

    `;


    const {
        data: products,
        error
    } = await supabaseClient
        .from("products")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "خطأ في تحميل المنتجات:",
            error
        );

        productsGrid.innerHTML = `

            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:40px;
                color:#c0392b;
            ">
                حدث خطأ أثناء تحميل المنتجات
            </div>

        `;

        return;
    }


    if (
        !products ||
        products.length === 0
    ) {

        productsGrid.innerHTML = `

            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:50px 20px;
                color:#8a8178;
            ">

                <i
                    class="fa-solid fa-box-open"
                    style="
                        font-size:35px;
                        margin-bottom:12px;
                    "
                ></i>

                <div>
                    لا توجد منتجات حتى الآن
                </div>

                <small>
                    أضيفي أول منتج من زر إضافة منتج
                </small>

            </div>

        `;

        return;
    }


    productsGrid.innerHTML =
        products
            .map(
                product =>
                    createProductCard(
                        product
                    )
            )
            .join("");
}


/* =========================================================
   PRODUCT CARD
========================================================= */

function createProductCard(
    product
) {

    const available =
        product.is_available !== false;

    const rating =
        Number(
            product.rating || 0
        ).toFixed(1);

    const price =
        Number(
            product.price || 0
        ).toLocaleString(
            "ar-SA",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        );


    const imageHTML =
        product.image_url

            ? `

                <img
                    src="${escapeHTML(
                        product.image_url
                    )}"
                    alt="${escapeHTML(
                        product.name ||
                        "منتج"
                    )}"
                    loading="lazy"
                >

            `

            : `

                <i
                    class="fa-solid fa-bottle-droplet"
                ></i>

            `;


    return `

        <article
            class="inner-product-card"
            data-id="${escapeHTML(
                String(product.id)
            )}"
        >

            <div class="inner-product-image">

                ${imageHTML}

            </div>


            <div class="inner-product-rating">

                ${rating}

                <i
                    class="fa-solid fa-star"
                ></i>

            </div>


            <div class="inner-product-name">

                ${escapeHTML(
                    product.name || ""
                )}

            </div>


            <div class="inner-product-category">

                ${escapeHTML(
                    product.category || ""
                )}

            </div>


            <div class="inner-product-price">

                ${price} ر.س

            </div>


            <button
                class="
                    inner-product-status
                    ${available
                        ? "available"
                        : "unavailable"}
                "
                type="button"
                onclick="
                    toggleProductAvailability(
                        '${escapeJS(
                            product.id
                        )}',
                        ${available}
                    )
                "
            >

                ${
                    available
                        ? "متاح"
                        : "غير متاح"
                }

            </button>


            <div class="inner-product-actions">

                <button
                    class="inner-product-edit"
                    type="button"
                    onclick="
                        editProduct(
                            '${escapeJS(
                                product.id
                            )}'
                        )
                    "
                >

                    <i
                        class="
                            fa-regular
                            fa-pen-to-square
                        "
                    ></i>

                    تعديل

                </button>


                <button
                    class="inner-product-delete"
                    type="button"
                    onclick="
                        deleteProduct(
                            '${escapeJS(
                                product.id
                            )}'
                        )
                    "
                >

                    <i
                        class="
                            fa-regular
                            fa-trash-can
                        "
                    ></i>

                    حذف

                </button>

            </div>

        </article>

    `;
}


/* =========================================================
   TOGGLE AVAILABILITY
========================================================= */

async function toggleProductAvailability(
    productId,
    currentStatus
) {

    try {

        const {
            data: isAdmin,
            error: adminError
        } = await supabaseClient
            .rpc("is_admin");

        if (
            adminError ||
            isAdmin !== true
        ) {

            alert(
                "ليس لديك صلاحية لتعديل المنتجات."
            );

            return;
        }


        const {
            error
        } = await supabaseClient
            .from("products")
            .update({

                is_available:
                    !currentStatus

            })
            .eq(
                "id",
                productId
            );

        if (error) {
            throw error;
        }

        await loadProducts();

    }
    catch (error) {

        console.error(
            "خطأ في تحديث حالة المنتج:",
            error
        );

        alert(
            "حدث خطأ أثناء تحديث حالة المنتج: " +
            (
                error.message ||
                ""
            )
        );
    }
}


/* =========================================================
   DELETE PRODUCT
========================================================= */

async function deleteProduct(
    productId
) {

    const confirmed =
        confirm(
            "هل أنت متأكدة من حذف هذا المنتج؟"
        );

    if (!confirmed) {
        return;
    }


    try {

        const {
            data: isAdmin,
            error: adminError
        } = await supabaseClient
            .rpc("is_admin");

        if (
            adminError ||
            isAdmin !== true
        ) {

            alert(
                "ليس لديك صلاحية لحذف المنتجات."
            );

            return;
        }


        const {
            data: product,
            error: fetchError
        } = await supabaseClient
            .from("products")
            .select("image_url")
            .eq(
                "id",
                productId
            )
            .single();

        if (fetchError) {
            throw fetchError;
        }


        const {
            error: deleteError
        } = await supabaseClient
            .from("products")
            .delete()
            .eq(
                "id",
                productId
            );

        if (deleteError) {
            throw deleteError;
        }


        if (
            product?.image_url &&
            product.image_url.includes(
                "/product-images/"
            )
        ) {

            try {

                const marker =
                    "/product-images/";

                const path =
                    product.image_url
                        .split(marker)[1];

                if (path) {

                    await supabaseClient
                        .storage
                        .from("product-images")
                        .remove([
                            decodeURIComponent(
                                path
                            )
                        ]);
                }

            }
            catch (imageError) {

                console.warn(
                    "تعذر حذف صورة المنتج:",
                    imageError
                );
            }
        }


        await loadProducts();

    }
    catch (error) {

        console.error(
            "خطأ في حذف المنتج:",
            error
        );

        alert(
            "لم يتم حذف المنتج: " +
            (
                error.message ||
                "حدث خطأ غير متوقع"
            )
        );
    }
}


/* =========================================================
   EDIT PRODUCT
========================================================= */

async function editProduct(
    productId
) {

    try {

        const {
            data: isAdmin,
            error: adminError
        } = await supabaseClient
            .rpc("is_admin");

        if (
            adminError ||
            isAdmin !== true
        ) {

            alert(
                "ليس لديك صلاحية لتعديل المنتجات."
            );

            return;
        }


        const {
            data: product,
            error
        } = await supabaseClient
            .from("products")
            .select("*")
            .eq(
                "id",
                productId
            )
            .single();

        if (error) {
            throw error;
        }

        if (!product) {

            alert(
                "لم يتم العثور على المنتج."
            );

            return;
        }


        document.getElementById(
            "productName"
        ).value =
            product.name || "";


        document.getElementById(
            "productDescription"
        ).value =
            product.description || "";


        document.getElementById(
            "productCategory"
        ).value =
            product.category || "";


        document.getElementById(
            "productPrice"
        ).value =
            product.price ?? "";


        


        document.getElementById(
            "productSalesCount"
        ).value =
            product.sales_count ?? 0;

            document.getElementById(
    "productStock"
).value =
    product.stock_quantity ?? 0;


        document.getElementById(
            "productAvailable"
        ).checked =
            product.is_available !== false;


        document.getElementById(
            "productFeatured"
        ).checked =
            product.is_featured === true;


        if (productImageInput) {

            productImageInput.value =
                "";
        }


        if (productImagePreview) {

            productImagePreview.innerHTML =
                product.image_url

                    ? `

                        <img
                            src="${escapeHTML(
                                product.image_url
                            )}"
                            alt="صورة المنتج"
                        >

                    `

                    : "";
        }


        productForm.dataset.editingId =
            productId;


        const modalTitle =
            productModalBackdrop?.querySelector(
                ".product-modal-header h2"
            );

        if (modalTitle) {

            modalTitle.textContent =
                "تعديل المنتج";
        }


        const modalDescription =
            productModalBackdrop?.querySelector(
                ".product-modal-header p"
            );

        if (modalDescription) {

            modalDescription.textContent =
                "عدّلي بيانات المنتج ثم احفظي التغييرات.";
        }


        if (saveProductBtn) {

            saveProductBtn.textContent =
                "حفظ التعديلات";
        }


        if (productFormMessage) {

            productFormMessage.textContent =
                "";

            productFormMessage.className =
                "product-form-message";
        }


        productModalBackdrop?.classList.add(
            "open"
        );

    }
    catch (error) {

        console.error(
            "Edit product error:",
            error
        );

        alert(
            "تعذر تحميل بيانات المنتج: " +
            (
                error.message ||
                ""
            )
        );
    }
}


/* =========================================================
   ORDERS
========================================================= */

let adminOrders = [];


/* =========================================================
   LOAD ORDERS
========================================================= */

async function loadOrders() {

    const tableBody =
        document.getElementById(
            "ordersTableBody"
        );

    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = `
        <tr>
            <td
                colspan="7"
                class="inner-orders-empty"
            >
                جاري تحميل الطلبات...
            </td>
        </tr>
    `;


    const {
        data,
        error
    } = await supabaseClient
        .from("orders")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Error loading orders:",
            error
        );

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="inner-orders-empty"
                >
                    حدث خطأ أثناء تحميل الطلبات
                </td>
            </tr>
        `;

        return;
    }


    adminOrders =
        data || [];

    renderOrders(
        adminOrders
    );
}


/* =========================================================
   RENDER ORDERS
========================================================= */

function renderOrders(
    orders
) {

    const tableBody =
        document.getElementById(
            "ordersTableBody"
        );

    if (!tableBody) {
        return;
    }


    if (
        !orders ||
        orders.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="inner-orders-empty"
                >
                    لا توجد طلبات حاليًا
                </td>
            </tr>
        `;

        return;
    }


    tableBody.innerHTML =
        orders
            .map(
                order => {

                    const orderNumber =
                        order.order_number ||
                        `ORD-${String(
                            order.id
                        )
                            .slice(
                                0,
                                6
                            )
                            .toUpperCase()}`;


                    const customerName =
                        order.customer_name ||
                        "عميل غير معروف";


                    const city =
                        order.city ||
                        "—";


                    const date =
                        formatAdminDate(
                            order.created_at
                        );


                    const total =
                        Number(
                            order.total || 0
                        ).toLocaleString(
                            "ar-SA"
                        );


                    const status =
                        order.status ||
                        "new";


                    return `

                        <tr>

                            <td
                                class="inner-order-number"
                            >
                                ${escapeHTML(
                                    orderNumber
                                )}
                            </td>


                            <td
                                class="inner-order-customer"
                            >
                                ${escapeHTML(
                                    customerName
                                )}
                            </td>


                            <td
                                class="inner-order-city"
                            >
                                ${escapeHTML(
                                    city
                                )}
                            </td>


                            <td
                                class="inner-order-date"
                            >
                                ${date}
                            </td>


                            <td
                                class="inner-order-total"
                            >
                                ${total} ر.س
                            </td>


                            <td>

                                <select
                                    class="inner-order-status ${escapeHTML(
                                        status
                                    )}"
                                    data-order-id="${escapeHTML(
                                        order.id
                                    )}"
                                    onchange="changeOrderStatus(this)"
                                >

                                    <option
                                        value="new"
                                        ${
                                            status === "new"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        جديد
                                    </option>


                                    <option
                                        value="processing"
                                        ${
                                            status === "processing"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        قيد التجهيز
                                    </option>


                                    <option
                                        value="completed"
                                        ${
                                            status === "completed"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        مكتمل
                                    </option>


                                    <option
                                        value="cancelled"
                                        ${
                                            status === "cancelled"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        ملغي
                                    </option>

                                </select>

                            </td>


                            <td>

                                <button
                                    class="inner-order-action"
                                    type="button"
                                    onclick="showOrderDetails('${escapeJS(
                                        order.id
                                    )}')"
                                >
                                    التفاصيل
                                </button>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");
}


/* =========================================================
   CHANGE ORDER STATUS
========================================================= */

async function changeOrderStatus(
    select
) {

    const orderId =
        select.dataset.orderId;

    const newStatus =
        select.value;


    if (!orderId) {
        return;
    }


    select.disabled =
        true;


    const {
        error
    } = await supabaseClient
        .from("orders")
        .update({

            status:
                newStatus,

            updated_at:
                new Date().toISOString()

        })
        .eq(
            "id",
            orderId
        );


    if (error) {

        console.error(
            "Error updating order:",
            error
        );

        alert(
            "حدث خطأ أثناء تحديث حالة الطلب."
        );

        select.disabled =
            false;

        return;
    }


    select.className =
        `inner-order-status ${newStatus}`;

    select.disabled =
        false;


    const order =
        adminOrders.find(
            item =>
                item.id ===
                orderId
        );


    if (order) {

        order.status =
            newStatus;
    }
}


/* =========================================================
   SEARCH + FILTER ORDERS
========================================================= */

function filterAdminOrders() {

    const searchInput =
        document.getElementById(
            "ordersSearch"
        );

    const statusFilter =
        document.getElementById(
            "ordersStatusFilter"
        );

    const periodFilter =
        document.getElementById(
            "ordersPeriodFilter"
        );


    if (
        !searchInput ||
        !statusFilter ||
        !periodFilter
    ) {

        return;
    }


    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const status =
        statusFilter.value;


    const period =
        periodFilter.value;


    const now =
        new Date();


    const filtered =
        adminOrders.filter(
            order => {

                const searchableText = `

                    ${order.order_number || ""}

                    ${order.customer_name || ""}

                    ${order.customer_phone || ""}

                    ${order.customer_email || ""}

                `.toLowerCase();


                const matchesSearch =
                    !search ||
                    searchableText.includes(
                        search
                    );


                const matchesStatus =
                    status === "all" ||
                    order.status === status;


                let matchesPeriod =
                    true;


                if (
                    period !== "all"
                ) {

                    const orderDate =
                        new Date(
                            order.created_at
                        );


                    if (
                        period === "today"
                    ) {

                        matchesPeriod =
                            orderDate.toDateString() ===
                            now.toDateString();

                    }


                    if (
                        period === "week"
                    ) {

                        const weekAgo =
                            new Date(
                                now
                            );

                        weekAgo.setDate(
                            now.getDate() - 7
                        );

                        matchesPeriod =
                            orderDate >=
                            weekAgo;

                    }


                    if (
                        period === "month"
                    ) {

                        const monthAgo =
                            new Date(
                                now
                            );

                        monthAgo.setMonth(
                            now.getMonth() - 1
                        );

                        matchesPeriod =
                            orderDate >=
                            monthAgo;

                    }

                }


                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesPeriod
                );

            }
        );


    renderOrders(
        filtered
    );
}


/* =========================================================
   ORDERS EVENTS
========================================================= */

function setupOrdersEvents() {

    const searchInput =
        document.getElementById(
            "ordersSearch"
        );

    const statusFilter =
        document.getElementById(
            "ordersStatusFilter"
        );

    const periodFilter =
        document.getElementById(
            "ordersPeriodFilter"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterAdminOrders
        );

    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            filterAdminOrders
        );

    }


    if (periodFilter) {

        periodFilter.addEventListener(
            "change",
            filterAdminOrders
        );

    }
}


/* =========================================================
   ORDER DATE
========================================================= */

function formatAdminDate(
    dateString
) {

    if (!dateString) {
        return "—";
    }


    const date =
        new Date(
            dateString
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";
    }


    return date.toLocaleDateString(
        "ar-SA",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );
}


/* =========================================================
   ORDER DETAILS
========================================================= */

async function showOrderDetails(
    orderId
) {

    const order =
        adminOrders.find(
            item =>
                item.id ===
                orderId
        );


    if (!order) {
        return;
    }


    alert(`

رقم الطلب:
${order.order_number || order.id}

العميل:
${order.customer_name || "—"}

الجوال:
${order.customer_phone || "—"}

البريد:
${order.customer_email || "—"}

المدينة:
${order.city || "—"}

الإجمالي:
${Number(
    order.total || 0
).toLocaleString(
    "ar-SA"
)} ر.س

الحالة:
${getOrderStatusText(
    order.status
)}

    `);
}


/* =========================================================
   ORDER STATUS TEXT
========================================================= */

function getOrderStatusText(
    status
) {

    const statuses = {

        new:
            "جديد",

        processing:
            "قيد التجهيز",

        completed:
            "مكتمل",

        cancelled:
            "ملغي"

    };


    return (
        statuses[status] ||
        status ||
        "—"
    );
}


/* =========================================================
   SETTINGS — REAL SUPABASE SETTINGS
========================================================= */

const saveSettingsButton =
    document.getElementById("saveSettings");


let currentStoreSettings = null;


/* =========================================================
   LOAD STORE SETTINGS
========================================================= */

async function loadStoreSettings() {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("store_settings")
            .select("*")
            .order("created_at", {
                ascending: true
            })
            .limit(1)
            .maybeSingle();


        if (error) {
            throw error;
        }


        /* =================================================
           إذا لم يوجد سجل، ننشئ الإعدادات الافتراضية
        ================================================= */

        if (!data) {

            const defaultSettings = {

                store_name:
                    "عودانا | OUDANA",

                email:
                    "info@oudana.sa",

                phone:
                    "0554400110",

                message:
                    "عطور وعود فاخر بخطوات أصيلة توصلك أينما كنت.",

                free_shipping:
                    500,

                shipping_fee:
                    25,

                delivery_days:
                    3,

                auto_confirm_orders:
                    true,

                email_notifications:
                    true,

                admin_name:
                    "روان",

                admin_email:
                    "admin@oudana.sa",

                two_factor_enabled:
                    false

            };


            const {
                data: createdSettings,
                error: createError
            } = await supabaseClient
                .from("store_settings")
                .insert([defaultSettings])
                .select()
                .single();


            if (createError) {
                throw createError;
            }


            currentStoreSettings =
                createdSettings;

        }
        else {

            currentStoreSettings =
                data;

        }


        fillSettingsForm(
            currentStoreSettings
        );


        applyAdminSettings(
            currentStoreSettings
        );


        console.log(
            "Store settings loaded ✓",
            currentStoreSettings
        );

    }
    catch (error) {

        console.error(
            "Error loading store settings:",
            error
        );

        alert(
            "تعذر تحميل إعدادات المتجر: " +
            (
                error.message ||
                "حدث خطأ غير متوقع"
            )
        );

    }

}


/* =========================================================
   FILL SETTINGS FORM
========================================================= */

function fillSettingsForm(
    settings
) {

    const storeName =
        document.getElementById(
            "storeName"
        );

    const storeEmail =
        document.getElementById(
            "storeEmail"
        );

    const storePhone =
        document.getElementById(
            "storePhone"
        );

    const storeMessage =
        document.getElementById(
            "storeMessage"
        );

    const freeShipping =
        document.getElementById(
            "freeShipping"
        );

    const shippingFee =
        document.getElementById(
            "shippingFee"
        );

    const deliveryDays =
        document.getElementById(
            "deliveryDays"
        );

    const autoConfirmOrders =
        document.getElementById(
            "autoConfirmOrders"
        );

    const emailNotifications =
        document.getElementById(
            "emailNotifications"
        );

    const adminName =
        document.getElementById(
            "adminName"
        );

    const adminEmail =
        document.getElementById(
            "adminEmail"
        );

    const twoFactorEnabled =
        document.getElementById(
            "twoFactorEnabled"
        );


    if (storeName) {

        storeName.value =
            settings.store_name || "";

    }


    if (storeEmail) {

        storeEmail.value =
            settings.email || "";

    }


    if (storePhone) {

        storePhone.value =
            settings.phone || "";

    }


    if (storeMessage) {

        storeMessage.value =
            settings.message || "";

    }


    if (freeShipping) {

        freeShipping.value =
            settings.free_shipping ?? 0;

    }


    if (shippingFee) {

        shippingFee.value =
            settings.shipping_fee ?? 0;

    }


    if (deliveryDays) {

        deliveryDays.value =
            settings.delivery_days ?? 0;

    }


    if (autoConfirmOrders) {

        autoConfirmOrders.checked =
            settings.auto_confirm_orders === true;

    }


    if (emailNotifications) {

        emailNotifications.checked =
            settings.email_notifications === true;

    }


    if (adminName) {

        adminName.value =
            settings.admin_name || "";

    }


    if (adminEmail) {

        adminEmail.value =
            settings.admin_email || "";

    }


    if (twoFactorEnabled) {

        twoFactorEnabled.checked =
            settings.two_factor_enabled === true;

    }

}


/* =========================================================
   GET SETTINGS FORM DATA
========================================================= */

function getSettingsFormData() {

    const storeName =
        document
            .getElementById("storeName")
            ?.value
            .trim();


    const email =
        document
            .getElementById("storeEmail")
            ?.value
            .trim();


    const phone =
        document
            .getElementById("storePhone")
            ?.value
            .trim();


    const message =
        document
            .getElementById("storeMessage")
            ?.value
            .trim();


    const freeShipping =
        Number(
            document
                .getElementById("freeShipping")
                ?.value || 0
        );


    const shippingFee =
        Number(
            document
                .getElementById("shippingFee")
                ?.value || 0
        );


    const deliveryDays =
        Number(
            document
                .getElementById("deliveryDays")
                ?.value || 0
        );


    const autoConfirmOrders =
        document
            .getElementById("autoConfirmOrders")
            ?.checked ?? true;


    const emailNotifications =
        document
            .getElementById("emailNotifications")
            ?.checked ?? true;


    const adminName =
        document
            .getElementById("adminName")
            ?.value
            .trim();


    const adminEmail =
        document
            .getElementById("adminEmail")
            ?.value
            .trim();


    const twoFactorEnabled =
        document
            .getElementById("twoFactorEnabled")
            ?.checked ?? false;


    return {

        store_name:
            storeName,

        email:
            email || null,

        phone:
            phone || null,

        message:
            message || null,

        free_shipping:
            freeShipping,

        shipping_fee:
            shippingFee,

        delivery_days:
            deliveryDays,

        auto_confirm_orders:
            autoConfirmOrders,

        email_notifications:
            emailNotifications,

        admin_name:
            adminName || null,

        admin_email:
            adminEmail || null,

        two_factor_enabled:
            twoFactorEnabled

    };

}


/* =========================================================
   VALIDATE SETTINGS
========================================================= */

function validateSettings(
    settings
) {

    if (!settings.store_name) {

        return "اكتبي اسم الموقع أولًا.";

    }


    if (
        !Number.isFinite(
            settings.free_shipping
        ) ||
        settings.free_shipping < 0
    ) {

        return "قيمة الشحن المجاني غير صحيحة.";

    }


    if (
        !Number.isFinite(
            settings.shipping_fee
        ) ||
        settings.shipping_fee < 0
    ) {

        return "رسوم الشحن غير صحيحة.";

    }


    if (
        !Number.isInteger(
            settings.delivery_days
        ) ||
        settings.delivery_days < 0
    ) {

        return "مدة التوصيل يجب أن تكون رقمًا صحيحًا.";

    }


    return null;

}


/* =========================================================
   SAVE SETTINGS
========================================================= */

async function saveStoreSettings() {

    if (!saveSettingsButton) {
        return;
    }


    const settings =
        getSettingsFormData();


    const validationError =
        validateSettings(
            settings
        );


    if (validationError) {

        alert(
            validationError
        );

        return;

    }


    const originalText =
        saveSettingsButton.textContent;


    saveSettingsButton.disabled =
        true;

    saveSettingsButton.textContent =
        "جاري الحفظ...";


    try {

        /* =============================================
           التأكد من أن المستخدم أدمن
        ============================================= */

        const {
            data: isAdmin,
            error: adminError
        } = await supabaseClient
            .rpc("is_admin");


        if (
            adminError ||
            isAdmin !== true
        ) {

            throw new Error(
                "ليس لديك صلاحية لتعديل إعدادات المتجر."
            );

        }


        /* =============================================
           إذا كان لدينا سجل موجود → UPDATE
        ============================================= */

        let result;


        if (currentStoreSettings?.id) {

            result =
                await supabaseClient
                    .from("store_settings")
                    .update({

                        ...settings,

                        updated_at:
                            new Date().toISOString()

                    })
                    .eq(
                        "id",
                        currentStoreSettings.id
                    )
                    .select()
                    .single();

        }


        /* =============================================
           إذا لم يكن لدينا سجل → INSERT
        ============================================= */

        else {

            result =
                await supabaseClient
                    .from("store_settings")
                    .insert([
                        settings
                    ])
                    .select()
                    .single();

        }


        if (result.error) {
            throw result.error;
        }


        currentStoreSettings =
            result.data;


        /* =============================================
           تطبيق الإعدادات مباشرة داخل لوحة الأدمن
        ============================================= */

        applyAdminSettings(
            currentStoreSettings
        );


        saveSettingsButton.textContent =
            "تم حفظ التغييرات ✓";


        saveSettingsButton.style.background =
            "#18794e";


        console.log(
            "Settings saved ✓",
            currentStoreSettings
        );


        setTimeout(
            () => {

                saveSettingsButton.textContent =
                    originalText;

                saveSettingsButton.style.background =
                    "";

                saveSettingsButton.disabled =
                    false;

            },
            1800
        );

    }
    catch (error) {

        console.error(
            "Settings save error:",
            error
        );


        alert(
            "لم يتم حفظ الإعدادات: " +
            (
                error.message ||
                "حدث خطأ غير متوقع"
            )
        );


        saveSettingsButton.disabled =
            false;

        saveSettingsButton.textContent =
            originalText;

    }

}


/* =========================================================
   APPLY SETTINGS INSIDE ADMIN
========================================================= */

function applyAdminSettings(
    settings
) {

    if (!settings) {
        return;
    }


    /* اسم المتجر في الهيدر */

    const headerBrand =
        document.querySelector(
            ".brand-small"
        );


    if (headerBrand) {

        headerBrand.textContent =
            settings.store_name ||
            "عودانا | OUDANA";

    }


    /* اسم المتجر في القائمة */

    const menuBrandArabic =
        document.querySelector(
            ".menu-brand-ar"
        );


    const menuBrandEnglish =
        document.querySelector(
            ".menu-brand-en"
        );


    const storeName =
        settings.store_name ||
        "عودانا | OUDANA";


    /*
       إذا كان الاسم بالشكل:
       عودانا | OUDANA

       نقسمه إلى عربي وإنجليزي.
    */

    if (storeName.includes("|")) {

        const parts =
            storeName
                .split("|")
                .map(
                    item =>
                        item.trim()
                );


        if (menuBrandArabic) {

            menuBrandArabic.textContent =
                parts[0] || "";

        }


        if (menuBrandEnglish) {

            menuBrandEnglish.textContent =
                parts[1] || "";

        }

    }
    else {

        if (menuBrandArabic) {

            menuBrandArabic.textContent =
                storeName;

        }

        if (menuBrandEnglish) {

            menuBrandEnglish.textContent =
                "";

        }

    }


    /* بيانات الأدمن */

    const adminNameElement =
        document.querySelector(
            ".admin-name"
        );


    const adminEmailElement =
        document.querySelector(
            ".admin-email"
        );


    if (adminNameElement) {

        adminNameElement.textContent =
            settings.admin_name ||
            "—";

    }


    if (adminEmailElement) {

        adminEmailElement.textContent =
            settings.admin_email ||
            "—";

    }

}


/* =========================================================
   SETTINGS BUTTON
========================================================= */

saveSettingsButton?.addEventListener(
    "click",
    saveStoreSettings
);



/* =========================================================
   SAFE HTML
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
   SAFE JS STRING
========================================================= */

function escapeJS(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        )
        .replace(
            /"/g,
            '\\"'
        );
}
 /* =========================================================
   OUDANA — DASHBOARD HOME
   Load real dashboard data from Supabase
========================================================= */

async function loadDashboard() {

    try {

        /* =====================================================
           1 — LOAD ORDERS
        ===================================================== */

        const { data: orders, error: ordersError } =
            await supabaseClient
                .from("orders")
                .select(`
                    id,
                    order_number,
                    customer_name,
                    total,
                    status,
                    created_at
                `)
                .order("created_at", {
                    ascending: false
                });


        if (ordersError) {
            throw ordersError;
        }


        const ordersList = orders || [];


        /* =====================================================
           2 — LOAD PRODUCTS
        ===================================================== */

        const { data: products, error: productsError } =
            await supabaseClient
                .from("products")
                .select(`
                    id,
                    name,
                    category,
                    price,
                    rating,
                    sales_count
                `)
                .order("sales_count", {
                    ascending: false
                });


        if (productsError) {
            throw productsError;
        }


        const productsList = products || [];


        /* =====================================================
           3 — LOAD CUSTOMERS COUNT
        ===================================================== */

        const { count: customersCount, error: customersError } =
            await supabaseClient
                .from("customers")
                .select("*", {
                    count: "exact",
                    head: true
                });


        if (customersError) {
            throw customersError;
        }


        /* =====================================================
           4 — CALCULATE SALES
        ===================================================== */

        const totalSales = ordersList.reduce(
            (sum, order) => {

                return sum + Number(order.total || 0);

            },
            0
        );


        /* =====================================================
           5 — UPDATE STATISTICS
        ===================================================== */

        const salesElement =
            document.getElementById("dashboardTotalSales");

        const ordersElement =
            document.getElementById("dashboardOrdersCount");

        const productsElement =
            document.getElementById("dashboardProductsCount");

        const customersElement =
            document.getElementById("dashboardCustomersCount");


        if (salesElement) {

            salesElement.innerHTML = `
                ${formatSaudiNumber(totalSales)}
                <span class="currency">
                    ر.س
                </span>
            `;

        }


        if (ordersElement) {

            ordersElement.textContent =
                formatSaudiNumber(ordersList.length);

        }


        if (productsElement) {

            productsElement.textContent =
                formatSaudiNumber(productsList.length);

        }


        if (customersElement) {

            customersElement.textContent =
                formatSaudiNumber(customersCount || 0);

        }


        /* =====================================================
           6 — RENDER LATEST ORDERS
        ===================================================== */

        renderDashboardOrders(ordersList);


        /* =====================================================
           7 — RENDER BEST SELLING PRODUCTS
        ===================================================== */

        renderDashboardBestProducts(productsList);


        console.log("Dashboard loaded from Supabase ✓");


    } catch (error) {

        console.error(
            "Error loading dashboard:",
            error
        );

    }

}

function renderDashboardOrders(orders) {

    const tbody =
        document.getElementById(
            "dashboardOrdersTableBody"
        );


    if (!tbody) return;


    if (!orders || orders.length === 0) {

        tbody.innerHTML = `
            <tr>

                <td
                    colspan="5"
                    style="
                        text-align:center;
                        padding:30px;
                    "
                >
                    لا توجد طلبات حاليًا
                </td>

            </tr>
        `;

        return;
    }


    const latestOrders =
        orders.slice(0, 5);


    tbody.innerHTML =
        latestOrders.map(order => {


            const date =
                new Date(order.created_at);


            const formattedDate =
                date.toLocaleDateString(
                    "ar-SA",
                    {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                    }
                );


            let statusText = "جديد";
            let statusClass = "pending";


            if (order.status === "processing") {

                statusText = "قيد التجهيز";
                statusClass = "pending";

            }


            if (order.status === "completed") {

                statusText = "مكتمل";
                statusClass = "completed";

            }


            if (order.status === "cancelled") {

                statusText = "ملغي";
                statusClass = "cancelled";

            }


            return `

                <tr>

                    <td class="order-number">
                        ${order.order_number || order.id}
                    </td>


                    <td class="customer-name">
                        ${order.customer_name || "—"}
                    </td>


                    <td class="date">
                        ${formattedDate}
                    </td>


                    <td class="amount">
                        ${formatSaudiNumber(order.total)}
                        ر.س
                    </td>


                    <td>

                        <span class="status ${statusClass}">
                            ${statusText}
                        </span>

                    </td>

                </tr>

            `;

        }).join("");

}
/* =========================================================
   DASHBOARD — ORDER STATUS CLASS
========================================================= */

function getDashboardStatusClass(
    status
) {

    if (status === "completed") {
        return "completed";
    }

    if (status === "cancelled") {
        return "cancelled";
    }

    if (status === "processing") {
        return "pending";
    }

    return "pending";
}
function renderDashboardBestProducts(products) {

    const container =
        document.getElementById(
            "dashboardBestProducts"
        );


    if (!container) return;


    if (!products || products.length === 0) {

        container.innerHTML = `
            <div
                style="
                    text-align:center;
                    padding:30px;
                    color:#77736b;
                "
            >
                لا توجد منتجات حاليًا
            </div>
        `;

        return;
    }


    const bestProducts =
        products.slice(0, 4);


    container.innerHTML =
        bestProducts.map(product => {


            return `

                <article class="best-product">


                    <div class="best-product-main">

                        <div class="best-product-icon">

                            <i class="fa-solid fa-bottle-droplet"></i>

                        </div>


                        <div class="best-product-info">

                            <h3>
                                ${product.name || "منتج"}
                            </h3>


                            <p>
                                ${product.category || "—"}
                            </p>

                        </div>

                    </div>



                    <div class="best-product-side">


                        <div class="rating">

                            ${formatSaudiNumber(product.rating || 0)}

                            <i class="fa-solid fa-star"></i>

                        </div>


                        <div class="sales-count">

                            ${formatSaudiNumber(product.sales_count || 0)}
                            عملية بيع

                        </div>


                        <div class="product-price">

                            ${formatSaudiNumber(product.price || 0)}
                            ر.س

                        </div>


                    </div>


                </article>

            `;

        }).join("");

}

/* =========================================================
   DASHBOARD — BEST SELLERS
========================================================= */

async function loadDashboardBestSellers() {

    const container =
        document.querySelector(
            ".products-list"
        );


    if (!container) {
        return;
    }


    const {
        data: products,
        error
    } = await supabaseClient
        .from("products")
        .select(
            "id, name, category, price, rating, sales_count, image_url"
        )
        .order(
            "sales_count",
            {
                ascending: false
            }
        )
        .limit(4);


    if (error) {

        console.error(
            "Best sellers error:",
            error
        );

        container.innerHTML = `

            <div style="
                padding:30px;
                text-align:center;
                color:#8a8178;
            ">
                تعذر تحميل المنتجات الأكثر مبيعًا.
            </div>

        `;

        return;
    }


    if (
        !products ||
        products.length === 0
    ) {

        container.innerHTML = `

            <div style="
                padding:30px;
                text-align:center;
                color:#8a8178;
            ">
                لا توجد منتجات حتى الآن.
            </div>

        `;

        return;
    }


    container.innerHTML =
        products
            .map(
                product => {

                    const rating =
                        Number(
                            product.rating || 0
                        ).toFixed(1);


                    const sales =
                        Number(
                            product.sales_count || 0
                        ).toLocaleString(
                            "ar-SA"
                        );


                    const price =
                        Number(
                            product.price || 0
                        ).toLocaleString(
                            "ar-SA"
                        );


                    return `

                        <article class="best-product">

                            <div class="best-product-main">

                                <div class="best-product-icon">

                                    ${
                                        product.image_url

                                        ? `

                                            <img
                                                src="${escapeHTML(
                                                    product.image_url
                                                )}"
                                                alt="${escapeHTML(
                                                    product.name || "منتج"
                                                )}"
                                                style="
                                                    width:100%;
                                                    height:100%;
                                                    object-fit:cover;
                                                    border-radius:inherit;
                                                "
                                            >

                                        `

                                        : `

                                            <i class="fa-solid fa-bottle-droplet"></i>

                                        `
                                    }

                                </div>


                                <div class="best-product-info">

                                    <h3>

                                        ${escapeHTML(
                                            product.name || ""
                                        )}

                                    </h3>


                                    <p>

                                        ${escapeHTML(
                                            product.category || ""
                                        )}

                                    </p>

                                </div>

                            </div>


                            <div class="best-product-side">

                                <div class="rating">

                                    ${rating}

                                    <i class="fa-solid fa-star"></i>

                                </div>


                                <div class="sales-count">

                                    ${sales}
                                    عملية بيع

                                </div>


                                <div class="product-price">

                                    ${price} ر.س

                                </div>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");
}
/* =========================================================
   OUDANA — STATISTICS
   Load statistics from Supabase
========================================================= */

async function loadStatistics() {

    try {

        /* =========================
           GET ORDERS
        ========================= */

        const { data: orders, error: ordersError } = await supabaseClient
            .from("orders")
            .select("id, total, created_at, status");

        if (ordersError) {
            throw ordersError;
        }


        /* =========================
           GET CUSTOMERS
        ========================= */

        const { count: customersCount, error: customersError } =
            await supabaseClient
                .from("customers")
                .select("*", { count: "exact", head: true });

        if (customersError) {
            throw customersError;
        }


        /* =========================
           CALCULATE SALES
        ========================= */

        const ordersList = orders || [];

        const totalSales = ordersList.reduce((sum, order) => {

            return sum + Number(order.total || 0);

        }, 0);


        /* =========================
           ORDERS COUNT
        ========================= */

        const ordersCount = ordersList.length;


        /* =========================
           AVERAGE ORDER
        ========================= */

        const averageOrder =
            ordersCount > 0
                ? totalSales / ordersCount
                : 0;


        /* =========================
           UPDATE HTML
        ========================= */

        const salesElement =
            document.getElementById("statisticsSales");

        const ordersElement =
            document.getElementById("statisticsOrders");

        const averageElement =
            document.getElementById("statisticsAverageOrder");

        const customersElement =
            document.getElementById("statisticsCustomers");


        if (salesElement) {

            salesElement.textContent =
                `${formatSaudiNumber(totalSales)} ر.س`;

        }


        if (ordersElement) {

            ordersElement.textContent =
                formatSaudiNumber(ordersCount);

        }


        if (averageElement) {

            averageElement.textContent =
                `${formatSaudiNumber(averageOrder)} ر.س`;

        }


        if (customersElement) {

            customersElement.textContent =
                formatSaudiNumber(customersCount || 0);

        }


        console.log("Statistics loaded ✓");


    } catch (error) {

        console.error("Error loading statistics:", error);

    }

}

function formatSaudiNumber(number) {

    return Number(number || 0).toLocaleString("ar-SA", {
        maximumFractionDigits: 2
    });

}
/* =========================================================
   OUDANA — STATISTICS CHARTS
   Dynamic charts from Supabase
========================================================= */


/* =========================================================
   GET CURRENT WEEK
   الأحد → السبت
========================================================= */

function getCurrentWeekDays() {

    const days = [];

    const today = new Date();

    today.setHours(0, 0, 0, 0);


    /*
       JavaScript:
       الأحد = 0
       الإثنين = 1
       ...
       السبت = 6
    */

    const currentDay = today.getDay();


    const sunday = new Date(today);

    sunday.setDate(
        today.getDate() - currentDay
    );


    for (let i = 0; i < 7; i++) {

        const date = new Date(sunday);

        date.setDate(
            sunday.getDate() + i
        );

        date.setHours(0, 0, 0, 0);


        days.push({
            date: date,
            sales: 0,
            orders: 0
        });

    }


    return days;

}



/* =========================================================
   SALES + ORDERS CHARTS
========================================================= */

async function loadWeeklyCharts() {

    try {

        const { data: orders, error } = await supabaseClient
            .from("orders")
            .select("id, total, created_at");


        if (error) {
            throw error;
        }


        const ordersList = orders || [];


        /* =========================
           CREATE WEEK
        ========================= */

        const days = getCurrentWeekDays();


        /* =========================
           CALCULATE DATA
        ========================= */

        ordersList.forEach(order => {

            if (!order.created_at) {
                return;
            }


            const orderDate = new Date(
                order.created_at
            );


            orderDate.setHours(
                0,
                0,
                0,
                0
            );


            days.forEach(day => {

                if (
                    orderDate.getTime() ===
                    day.date.getTime()
                ) {

                    day.sales += Number(
                        order.total || 0
                    );


                    day.orders += 1;

                }

            });

        });


        console.log(
            "Weekly statistics:",
            days
        );


        /* =====================================================
           SALES LINE CHART
        ===================================================== */

        renderSalesChart(days);


        /* =====================================================
           ORDERS BAR CHART
        ===================================================== */

        renderOrdersBarChart(days);


    } catch (error) {

        console.error(
            "Error loading weekly charts:",
            error
        );

    }

}



/* =========================================================
   SALES LINE CHART
========================================================= */

function renderSalesChart(days) {

    const path =
        document.getElementById(
            "salesChartPath"
        );


    const pointsGroup =
        document.getElementById(
            "salesChartPoints"
        );


    if (!path || !pointsGroup) {
        return;
    }


    /* =========================
       MAX VALUE
    ========================= */

    const maxSales = Math.max(
        ...days.map(day => day.sales),
        1
    );


    /*
       نخلي أعلى قيمة في الرسم
       رقم مرتب بدل رقم عشوائي
    */

    const chartMax =
        Math.ceil(maxSales / 100) * 100;


    const chartHeight = 208;

    const top = 22;

    const bottom = 230;

    const chartRange =
        bottom - top;


    const xPositions = [
        48,
        110,
        172,
        234,
        296,
        358,
        420
    ];


    /* =========================
       CREATE POINTS
    ========================= */

    const points = days.map(
        (day, index) => {

            const x =
                xPositions[index];


            let y;

            if (day.sales === 0) {

                y = bottom;

            } else {

                y =
                    bottom -
                    (
                        day.sales /
                        chartMax
                    ) *
                    chartRange;

            }


            return {
                x,
                y,
                sales: day.sales
            };

        }
    );


    /* =========================
       CREATE SVG PATH
    ========================= */

    let pathData = "";


    points.forEach(
        (point, index) => {

            if (index === 0) {

                pathData =
                    `M ${point.x} ${point.y}`;

                return;

            }


            const previous =
                points[index - 1];


            const middleX =
                (
                    previous.x +
                    point.x
                ) / 2;


            pathData +=
                ` C ${middleX} ${previous.y},
                    ${middleX} ${point.y},
                    ${point.x} ${point.y}`;

        }
    );


    path.setAttribute(
        "d",
        pathData
    );


    /* =========================
       CREATE POINTS
    ========================= */

    pointsGroup.innerHTML =
        points.map(point => {

            return `
                <circle
                    class="line-point"
                    cx="${point.x}"
                    cy="${point.y}"
                    r="3.8"
                />
            `;

        }).join("");


    /* =========================
       UPDATE Y AXIS
    ========================= */

    const maxLabel =
        document.getElementById(
            "salesChartMaxLabel"
        );


    const label75 =
        document.getElementById(
            "salesChart75Label"
        );


    const label50 =
        document.getElementById(
            "salesChart50Label"
        );


    const label25 =
        document.getElementById(
            "salesChart25Label"
        );


    if (maxLabel) {

        maxLabel.textContent =
            formatSaudiNumber(chartMax);

    }


    if (label75) {

        label75.textContent =
            formatSaudiNumber(
                chartMax * 0.75
            );

    }


    if (label50) {

        label50.textContent =
            formatSaudiNumber(
                chartMax * 0.50
            );

    }


    if (label25) {

        label25.textContent =
            formatSaudiNumber(
                chartMax * 0.25
            );

    }


    /* =========================
       TOOLTIP
    ========================= */

    const highestDay =
        days.reduce(
            (highest, day) => {

                return day.sales >
                    highest.sales
                    ? day
                    : highest;

            },
            days[0]
        );


    const highestIndex =
        days.indexOf(
            highestDay
        );


    const dayNames = [
        "الأحد",
        "الإثنين",
        "الثلاثاء",
        "الأربعاء",
        "الخميس",
        "الجمعة",
        "السبت"
    ];


    const tooltipBox =
        document.getElementById(
            "salesTooltipBox"
        );


    const tooltipTitle =
        document.getElementById(
            "salesTooltipTitle"
        );


    const tooltipValue =
        document.getElementById(
            "salesTooltipValue"
        );


    if (
        tooltipBox &&
        tooltipTitle &&
        tooltipValue
    ) {

        if (highestDay.sales > 0) {

            let tooltipX = 215;

            let tooltipY =
                points[highestIndex].y -
                80;


            if (tooltipY < 30) {
                tooltipY = 30;
            }


            if (tooltipY > 155) {
                tooltipY = 155;
            }


            tooltipBox.setAttribute(
                "x",
                tooltipX
            );

            tooltipBox.setAttribute(
                "y",
                tooltipY
            );


            tooltipTitle.setAttribute(
                "x",
                tooltipX + 122
            );

            tooltipTitle.setAttribute(
                "y",
                tooltipY + 24
            );


            tooltipValue.setAttribute(
                "x",
                tooltipX + 122
            );

            tooltipValue.setAttribute(
                "y",
                tooltipY + 48
            );


            tooltipTitle.textContent =
                dayNames[highestIndex];


            tooltipValue.textContent =
                `المبيعات : ${formatSaudiNumber(
                    highestDay.sales
                )} ر.س`;


            tooltipBox.setAttribute(
                "opacity",
                "1"
            );


            tooltipTitle.setAttribute(
                "opacity",
                "1"
            );


            tooltipValue.setAttribute(
                "opacity",
                "1"
            );

        } else {

            tooltipBox.setAttribute(
                "opacity",
                "0"
            );


            tooltipTitle.setAttribute(
                "opacity",
                "0"
            );


            tooltipValue.setAttribute(
                "opacity",
                "0"
            );

        }

    }

}



/* =========================================================
   ORDERS BAR CHART
========================================================= */

function renderOrdersBarChart(days) {

    const bars =
        document.querySelectorAll(
            "#ordersBarChart .bar-fill"
        );


    if (!bars.length) {
        return;
    }


    const maxOrders = Math.max(
        ...days.map(day => day.orders),
        1
    );


    bars.forEach(
        (bar, index) => {

            const orders =
                days[index]
                    ? days[index].orders
                    : 0;


            /*
               إذا كان اليوم فيه طلبات:
               نحسب النسبة من أعلى يوم.

               وإذا ما فيه:
               نخليه على ارتفاع بسيط.
            */

            let height =
                orders > 0
                    ? (
                        orders /
                        maxOrders
                    ) * 100
                    : 8;


            if (height < 8) {
                height = 8;
            }


            bar.style.height =
                `${height}%`;


            bar.title =
                `${orders} طلب`;


        }
    );



    console.log(
        "Orders chart updated ✓"
    );

}



/* =========================================================
   TOP PRODUCTS CHART
========================================================= */

async function loadTopProductsChart() {

    try {

        const { data: products, error } =
            await supabaseClient
                .from("products")
                .select(
                    "name, sales_count"
                )
                .order(
                    "sales_count",
                    {
                        ascending: false
                    }
                )
                .limit(5);


        if (error) {
            throw error;
        }


        const productsList =
            products || [];


        renderTopProducts(
            productsList
        );


    } catch (error) {

        console.error(
            "Error loading top products:",
            error
        );

    }

}



/* =========================================================
   RENDER TOP PRODUCTS
========================================================= */

function renderTopProducts(products) {

    const container =
        document.getElementById(
            "topProductsChart"
        );


    if (!container) {
        return;
    }


    if (
        !products ||
        products.length === 0
    ) {

        container.innerHTML = `
            <div
                style="
                    text-align:center;
                    color:var(--muted);
                    font-size:11px;
                    padding:25px 0;
                "
            >
                لا توجد بيانات مبيعات للمنتجات حاليًا
            </div>
        `;

        return;

    }


    /* =========================
       MAX SALES
    ========================= */

    const maxSales = Math.max(
        ...products.map(
            product =>
                Number(
                    product.sales_count || 0
                )
        ),
        1
    );


    /* =========================
       CREATE ROWS
    ========================= */

    container.innerHTML =
        products.map(
            product => {

                const sales =
                    Number(
                        product.sales_count || 0
                    );


                const percentage =
                    (
                        sales /
                        maxSales
                    ) * 100;


                return `
                    <div
                        class="horizontal-row"
                    >

                        <div
                            class="horizontal-name"
                            title="${escapeHtml(
                                product.name || ""
                            )}"
                        >
                            ${escapeHtml(
                                product.name ||
                                "منتج بدون اسم"
                            )}
                        </div>


                        <div
                            class="horizontal-track"
                        >

                            <div
                                class="horizontal-fill"
                                style="
                                    width:${percentage}%;
                                "
                            ></div>

                        </div>


                        <div
                            class="horizontal-value"
                        >
                            ${formatSaudiNumber(
                                sales
                            )}
                        </div>

                    </div>
                `;

            }
        ).join("");


    console.log(
        "Top products chart updated ✓"
    );

}



/* =========================================================
   SAFE HTML
========================================================= */

function escapeHtml(value) {

    return String(value || "")
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
   LOAD ALL CHARTS
========================================================= */

async function loadStatisticsCharts() {

    await loadWeeklyCharts();

    await loadTopProductsChart();

    console.log(
        "All statistics charts loaded ✓"
    );

}

/* =========================================================
   OUDANA — SALES CHART
   آخر 7 أيام
========================================================= */

async function loadSalesChart() {

    try {

        const { data: orders, error } = await supabaseClient
            .from("orders")
            .select("total, created_at");

        if (error) {
            throw error;
        }


        const ordersList = orders || [];


        /* =========================
           إنشاء آخر 7 أيام
        ========================= */

        const days = [];

        for (let i = 6; i >= 0; i--) {

            const date = new Date();

            date.setHours(0, 0, 0, 0);

            date.setDate(date.getDate() - i);

            days.push({
                date: date,
                sales: 0
            });

        }


        /* =========================
           تجميع المبيعات
        ========================= */

        ordersList.forEach(order => {

            if (!order.created_at) return;

            const orderDate = new Date(order.created_at);

            orderDate.setHours(0, 0, 0, 0);


            days.forEach(day => {

                if (
                    orderDate.getTime() ===
                    day.date.getTime()
                ) {

                    day.sales += Number(order.total || 0);

                }

            });

        });


        console.log("Sales chart data:", days);


        /* =========================
           SVG
        ========================= */

        const chart = document.querySelector(
            ".statistics-line-chart svg"
        );

        if (!chart) {

            console.warn("Sales chart SVG not found");

            return;

        }


        /* =========================
           أبعاد الرسم
        ========================= */

        const chartWidth = 700;

        const chartHeight = 260;

        const paddingX = 50;

        const paddingY = 25;


        const maxSales = Math.max(
            ...days.map(day => day.sales),
            1
        );


        /* =========================
           حساب النقاط
        ========================= */

        const points = days.map((day, index) => {

            const x =
                paddingX +
                (
                    index *
                    (
                        (chartWidth - paddingX * 2) /
                        (days.length - 1)
                    )
                );


            const y =
                chartHeight -
                paddingY -
                (
                    (day.sales / maxSales) *
                    (chartHeight - paddingY * 2)
                );


            return {
                x,
                y,
                sales: day.sales,
                date: day.date
            };

        });


        /* =========================
           رسم الخط
        ========================= */

        const pathData = points
            .map((point, index) => {

                return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;

            })
            .join(" ");


        const path = chart.querySelector(
            ".sales-chart-line"
        );


        if (path) {

            path.setAttribute(
                "d",
                pathData
            );

        }


        /* =========================
           النقاط
        ========================= */

        const circlesGroup = chart.querySelector(
            ".sales-chart-points"
        );


        if (circlesGroup) {

            circlesGroup.innerHTML = points
                .map(point => {

                    return `
                        <circle
                            cx="${point.x}"
                            cy="${point.y}"
                            r="5"
                            class="sales-chart-point"
                        >
                        </circle>
                    `;

                })
                .join("");

        }


        /* =========================
           الأيام
        ========================= */

        const labelsGroup = chart.querySelector(
            ".sales-chart-labels"
        );


        if (labelsGroup) {

            labelsGroup.innerHTML = points
                .map(point => {

                    const dayName =
                        point.date.toLocaleDateString(
                            "ar-SA",
                            {
                                weekday: "short"
                            }
                        );

                    return `
                        <text
                            x="${point.x}"
                            y="${chartHeight + 5}"
                            text-anchor="middle"
                        >
                            ${dayName}
                        </text>
                    `;

                })
                .join("");

        }


        /* =========================
           أرقام المبيعات
        ========================= */

        const valuesGroup = chart.querySelector(
            ".sales-chart-values"
        );


        if (valuesGroup) {

            valuesGroup.innerHTML = points
                .map(point => {

                    return `
                        <text
                            x="${point.x}"
                            y="${point.y - 12}"
                            text-anchor="middle"
                        >
                            ${formatSaudiNumber(point.sales)}
                        </text>
                    `;

                })
                .join("");

        }


    } catch (error) {

        console.error(
            "Error loading sales chart:",
            error
        );

    }

}
/* =========================================================
   OUDANA — CUSTOMERS
   Load customers from Supabase
========================================================= */

let allCustomers = [];


async function loadCustomers() {

    const tbody = document.getElementById("customersTableBody");

    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="4" style="text-align:center; padding:30px;">
                جاري تحميل العملاء...
            </td>
        </tr>
    `;


    try {

        const { data, error } = await supabaseClient
            .from("customers")
            .select("*")
            .order("created_at", { ascending: false });


        if (error) {
            throw error;
        }


        allCustomers = data || [];


        renderCustomers(allCustomers);


        console.log("Customers loaded:", allCustomers);


    } catch (error) {

        console.error("Error loading customers:", error);


        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center; padding:30px;">
                    حدث خطأ أثناء تحميل العملاء
                </td>
            </tr>
        `;

    }

}



function renderCustomers(customers) {

    const tbody = document.getElementById("customersTableBody");

    if (!tbody) return;


    if (!customers || customers.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center; padding:30px;">
                    لا يوجد عملاء حاليًا
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML = customers.map(customer => {

        return `
            <tr>

                <td class="inner-customer-name">
                    ${customer.name || "—"}
                </td>


                <td class="inner-customer-email">
                    ${customer.email || "—"}
                </td>


                <td class="inner-customer-phone">
                    ${customer.phone || "—"}
                </td>


                <td class="inner-customer-city">
                    ${customer.city || "—"}
                </td>

            </tr>
        `;

    }).join("");

}

/* =========================================================
   OUDANA — COMPLAINTS
   Load complaints from Supabase
========================================================= */

let allComplaints = [];
let allComplaintCustomers = [];


/* =========================================================
   LOAD COMPLAINTS
========================================================= */

async function loadComplaints() {

    const tbody =
        document.getElementById("complaintsTableBody");

    if (!tbody) return;


    tbody.innerHTML = `
        <tr>
            <td
                colspan="6"
                style="text-align:center;padding:30px;"
            >
                جاري تحميل الشكاوى...
            </td>
        </tr>
    `;


    try {

        /* -----------------------------------------
           تحميل الشكاوى
        ----------------------------------------- */

        const {
            data: complaints,
            error: complaintsError
        } = await supabaseClient

            .from("complaints")

            .select("*")

            .order("created_at", {
                ascending: false
            });


        if (complaintsError) {
            throw complaintsError;
        }


        allComplaints = complaints || [];


        /* -----------------------------------------
           استخراج user_id للعملاء
        ----------------------------------------- */

        const userIds = [
            ...new Set(
                allComplaints
                    .map(complaint => complaint.user_id)
                    .filter(Boolean)
            )
        ];


        /* -----------------------------------------
           تحميل بيانات العملاء
        ----------------------------------------- */

        let customers = [];


        if (userIds.length > 0) {

            const {
                data,
                error: customersError
            } = await supabaseClient

                .from("customers")

                .select(
                    "user_id,name,email,phone,city"
                )

                .in("user_id", userIds);


            if (customersError) {
                throw customersError;
            }


            customers = data || [];

        }


        allComplaintCustomers = customers;


        /* -----------------------------------------
           عرض الشكاوى
        ----------------------------------------- */

        renderComplaints(allComplaints);


        console.log(
            "Complaints loaded:",
            allComplaints
        );

    }

    catch (error) {

        console.error(
            "Error loading complaints:",
            error
        );


        tbody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:30px;
                        color:#a33;
                    "
                >
                    حدث خطأ أثناء تحميل الشكاوى
                </td>
            </tr>
        `;

    }

}


/* =========================================================
   RENDER COMPLAINTS
========================================================= */

function renderComplaints(complaints) {

    const tbody =
        document.getElementById(
            "complaintsTableBody"
        );


    const countElement =
        document.getElementById(
            "complaintsCount"
        );


    if (!tbody) return;


    /* عدد الشكاوى */

    if (countElement) {

        countElement.textContent =
            complaints.length;

    }


    /* لا توجد شكاوى */

    if (
        !complaints ||
        complaints.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:40px;
                        color:#777;
                    "
                >
                    لا توجد شكاوى حاليًا
                </td>
            </tr>
        `;

        return;

    }


    /* عرض الصفوف */

    tbody.innerHTML = complaints
        .map(complaint => {


            const customer =
                allComplaintCustomers.find(
                    item =>
                        item.user_id ===
                        complaint.user_id
                );


            const customerName =
                customer?.name ||
                "عميل غير معروف";


            const customerEmail =
                customer?.email ||
                "—";


            const statusInfo =
                getComplaintStatusInfo(
                    complaint.status
                );


            const typeText =
                complaint.type === "inquiry"
                    ? "استفسار"
                    : "شكوى";


            const date =
                formatComplaintDate(
                    complaint.created_at
                );


            return `

                <tr>

                    <td>

                        <div class="complaint-customer">

                            <strong>
                                ${escapeHtml(
                                    customerName
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    customerEmail
                                )}
                            </span>

                        </div>

                    </td>


                    <td>

                        <div
                            class="complaint-subject"
                            title="${escapeHtml(
                                complaint.subject || ""
                            )}"
                        >
                            ${escapeHtml(
                                complaint.subject ||
                                "بدون موضوع"
                            )}
                        </div>

                    </td>


                    <td>
                        ${typeText}
                    </td>


                    <td>

                        <span
                            class="
                                complaint-status
                                ${statusInfo.className}
                            "
                        >
                            ${statusInfo.label}
                        </span>

                    </td>


                    <td>
                        ${date}
                    </td>


                    <td>

                        <button
                            type="button"
                            class="complaint-view-btn"
                            onclick="showComplaintDetails('${complaint.id}')"
                        >
                            عرض الشكوى
                        </button>

                    </td>

                </tr>

            `;

        })
        .join("");

}


/* =========================================================
   COMPLAINT STATUS
========================================================= */

function getComplaintStatusInfo(status) {

    switch (status) {

        case "processing":

            return {
                label: "قيد المعالجة",
                className: "processing"
            };


        case "resolved":

            return {
                label: "تم الحل",
                className: "resolved"
            };


        case "closed":

            return {
                label: "مغلقة",
                className: "closed"
            };


        case "open":

        default:

            return {
                label: "جديدة",
                className: "open"
            };

    }

}


/* =========================================================
   COMPLAINT DATE
========================================================= */

function formatComplaintDate(date) {

    if (!date) {
        return "—";
    }


    return new Date(date).toLocaleDateString(
        "ar-SA",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}

/* =========================================================
   COMPLAINTS FILTER
========================================================= */

const complaintsStatusFilter =
    document.getElementById(
        "complaintsStatusFilter"
    );


if (complaintsStatusFilter) {

    complaintsStatusFilter.addEventListener(
        "change",
        function () {

            const selectedStatus =
                this.value;


            if (selectedStatus === "all") {

                renderComplaints(
                    allComplaints
                );

                return;

            }


            const filteredComplaints =
                allComplaints.filter(
                    complaint =>
                        complaint.status ===
                        selectedStatus
                );


            renderComplaints(
                filteredComplaints
            );

        }
    );

}
/* =========================================================
   INITIALIZE ADMIN
========================================================= */
async function initializeAdmin() {

    showAdminPage("dashboard");

    await loadStoreSettings();

    await loadProducts();

    await loadOrders();

    await loadCustomers();

    await loadComplaints();

    await loadStatistics();

    await loadDashboard();

    setupOrdersEvents();

    console.log(
        "OUDANA Admin initialized ✓"
    );

}


/* =========================================================
   START
========================================================= */

(async function startAdmin() {

    const isAdmin =
        await checkAdminSession();


    if (!isAdmin) {
        return;
    }


    await initializeAdmin();

})();

/* =========================================================
   LOGOUT
========================================================= */

const logoutButton = document.querySelector(".logout");

if (logoutButton) {

    logoutButton.addEventListener("click", async () => {

        const { error } = await supabaseClient.auth.signOut();

        if (error) {
            console.error("Logout error:", error);
            return;
        }

        window.location.href = "login.html";

    });

}
