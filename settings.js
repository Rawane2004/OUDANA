/* =========================================================
   OUDANA — GLOBAL STORE SETTINGS
   Reads store settings from Supabase
========================================================= */

const OUDANA_SETTINGS_URL =
    "https://gpncttjpcucnbaatwjoy.supabase.co";

const OUDANA_SETTINGS_KEY =
    "sb_publishable_emYCVcv_b9gLa62n3D1pPg_lI5xRnD4";


const oudanaSettingsClient =
    supabase.createClient(
        OUDANA_SETTINGS_URL,
        OUDANA_SETTINGS_KEY
    );


/* =========================================================
   LOAD STORE SETTINGS
========================================================= */

async function loadGlobalStoreSettings() {

    try {

        const {
            data,
            error
        } = await oudanaSettingsClient
            .from("store_settings")
            .select(`
                store_name,
                email,
                phone,
                message,
                free_shipping,
                shipping_fee,
                delivery_days
            `)
            .order("created_at", {
                ascending: true
            })
            .limit(1)
            .maybeSingle();


        if (error) {

            console.error(
                "Global settings error:",
                error
            );

            return;

        }


        if (!data) {
            return;
        }


        applyGlobalStoreSettings(
            data
        );


    }
    catch (error) {

        console.error(
            "Failed to load global settings:",
            error
        );

    }

}


/* =========================================================
   APPLY SETTINGS TO WEBSITE
========================================================= */

function applyGlobalStoreSettings(
    settings
) {

    const storeName =
        settings.store_name ||
        "عودانا | OUDANA";


    /* =====================================================
       STORE NAME ELEMENTS
    ===================================================== */

    document
        .querySelectorAll(
            "[data-store-name]"
        )
        .forEach(
            element => {

                element.textContent =
                    storeName;

            }
        );


    /* =====================================================
       BRAND ELEMENTS
    ===================================================== */

    const arabicBrands =
        document.querySelectorAll(
            ".logo-arabic, .menu-brand-ar"
        );


    const englishBrands =
        document.querySelectorAll(
            ".logo-english, .menu-brand-en"
        );


    if (storeName.includes("|")) {

        const parts =
            storeName
                .split("|")
                .map(
                    item =>
                        item.trim()
                );


        arabicBrands.forEach(
            element => {

                element.textContent =
                    parts[0] || "";

            }
        );


        englishBrands.forEach(
            element => {

                element.textContent =
                    parts[1] || "";

            }
        );

    }
    else {

        arabicBrands.forEach(
            element => {

                element.textContent =
                    storeName;

            }
        );


        englishBrands.forEach(
            element => {

                element.textContent =
                    "";

            }
        );

    }


    /* =====================================================
       PAGE TITLE
    ===================================================== */

    updatePageTitle(
        storeName
    );


    /* =====================================================
       OTHER SETTINGS
    ===================================================== */

    document
        .querySelectorAll(
            "[data-store-email]"
        )
        .forEach(
            element => {

                element.textContent =
                    settings.email || "";

            }
        );


    document
        .querySelectorAll(
            "[data-store-phone]"
        )
        .forEach(
            element => {

                element.textContent =
                    settings.phone || "";

            }
        );


    document
        .querySelectorAll(
            "[data-store-message]"
        )
        .forEach(
            element => {

                element.textContent =
                    settings.message || "";

            }
        );


    document
        .querySelectorAll(
            "[data-free-shipping]"
        )
        .forEach(
            element => {

                element.textContent =
                    Number(
                        settings.free_shipping || 0
                    ).toLocaleString(
                        "ar-SA"
                    );

            }
        );


    document
        .querySelectorAll(
            "[data-shipping-fee]"
        )
        .forEach(
            element => {

                element.textContent =
                    Number(
                        settings.shipping_fee || 0
                    ).toLocaleString(
                        "ar-SA"
                    );

            }
        );


    document
        .querySelectorAll(
            "[data-delivery-days]"
        )
        .forEach(
            element => {

                element.textContent =
                    Number(
                        settings.delivery_days || 0
                    ).toLocaleString(
                        "ar-SA"
                    );

            }
        );

}


/* =========================================================
   UPDATE PAGE TITLE
========================================================= */

function updatePageTitle(
    storeName
) {

    const currentTitle =
        document.title;


    if (!currentTitle) {

        document.title =
            storeName;

        return;

    }


    /*
       نحافظ على اسم الصفحة:

       قبل:
       عودانا | المفضلة

       بعد:
       اسم المتجر الجديد | المفضلة
    */

    const separator =
        currentTitle.indexOf("|");


    if (separator !== -1) {

        const pageName =
            currentTitle
                .slice(separator + 1)
                .trim();


        document.title =
            `${storeName} | ${pageName}`;

    }
    else {

        document.title =
            storeName;

    }

}


/* =========================================================
   START
========================================================= */

if (
    typeof supabase !== "undefined"
) {

    loadGlobalStoreSettings();

}
