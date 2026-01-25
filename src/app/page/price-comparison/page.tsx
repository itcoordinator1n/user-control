'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Package, Tag } from 'lucide-react';

// --- 1. Definición de Tipos (Interfaces) ---

// Estructura interna de cada farmacia (baseA, baseB, precio)
interface PharmacyDetail {
  score: number;
  price: number | null;
  baseA: {
    key: string;
    quantities: string[];
    precioUnitario?: boolean;
  };
  baseB: {
    key: string;
    quantities: string[];
    precioUnitario?: boolean;
  };
}

// Mapa de farmacias (ej: "kielsa": { ... })
type PharmacyMap = Record<string, PharmacyDetail>;

// Estructura de un producto válido (con unitPrice, etc.)
interface ProductDetails {
  unitPrice?: PharmacyMap;
  mayoritaryPrice?: PharmacyMap;
  [key: string]: any; // Para manejar propiedades extras dinámicas
}

// El objeto base puede ser un detalle de producto o un array vacío (como en el caso de Acetaminofen)
type RawProductValue = ProductDetails | any[];

// Estructura principal del JSON que recibes
interface RawData {
  [category: string]: {
    [productName: string]: RawProductValue;
  };
}

// Estructura "limpia" que usaremos en la UI
interface NormalizedProduct {
  id: string;
  category: string;
  name: string;
  prices: {
    pharmacy: string;
    unitPrice: number;
    wholesalePrice: number;
  }[];
}

// --- 2. Datos de Ejemplo (Tu JSON) ---

const RAW_DATA: RawData = {
    "Analgesico": {
        "ACETAMINOFEN MK 500G": [],
        "ALEVE 36 tab": [],
        "ALIVIOL FORTE": {
            "unitPrice": {
                "kielsa": {
                    "score": 0,
                    "baseA": {
                        "key": "ALIVIOL FORTE",
                        "quantities": []
                    },
                    "baseB": {
                        "key": "ALIVIOL FORTE",
                        "quantities": []
                    },
                    "price": 0
                },
                "farmaciasAhorro": {
                    "score": 0.7333333333333333,
                    "baseA": {
                        "key": "aliviol forte",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "aliviol forte tabletas",
                        "quantities": [],
                        "precioUnitario": true
                    },
                    "price": 11.92
                },
                "farmaciasSiman": {
                    "score": 0.7586206896551724,
                    "baseA": {
                        "key": "aliviol forte",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "aliviol forte tableta",
                        "quantities": [
                            "550mg"
                        ],
                        "precioUnitario": true
                    },
                    "price": 11.97
                }
            },
            "mayoritaryPrice": {
                "kielsa": {
                    "score": 0.88,
                    "baseA": {
                        "key": "aliviol forte",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "aliviol forte tab",
                        "quantities": [
                            "x36"
                        ],
                        "precioUnitario": false
                    },
                    "price": null
                },
                "farmaciasAhorro": {
                    "score": 0,
                    "baseA": {
                        "key": "ALIVIOL FORTE",
                        "quantities": []
                    },
                    "baseB": {
                        "key": "ALIVIOL FORTE",
                        "quantities": []
                    },
                    "price": 0
                },
                "farmaciasSiman": {
                    "score": 0.7096774193548387,
                    "baseA": {
                        "key": "aliviol forte",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "aliviol forte tabletas x",
                        "quantities": [
                            "550mg",
                            "36"
                        ],
                        "precioUnitario": false
                    },
                    "price": 448.39
                }
            },
            "kielsa": {
                "score": 0.8461538461538461,
                "baseA": {
                    "key": "aliviol forte",
                    "quantities": [],
                    "precioUnitario": false
                },
                "baseB": {
                    "key": "aliviol forte tab x",
                    "quantities": [
                        "550mg",
                        "12"
                    ],
                    "precioUnitario": false
                }
            }
        },
        "ALIVIOL MIGRAÑA": {
            "unitPrice": {
                "kielsa": {
                    "score": 0,
                    "baseA": {
                        "key": "ALIVIOL MIGRAÑA",
                        "quantities": []
                    },
                    "baseB": {
                        "key": "ALIVIOL MIGRAÑA",
                        "quantities": []
                    },
                    "price": 0
                },
                "farmaciasAhorro": {
                    "score": 0.7647058823529411,
                    "baseA": {
                        "key": "aliviol migrana",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "aliviol migrana tabletas",
                        "quantities": [],
                        "precioUnitario": true
                    },
                    "price": 5.41
                },
                "farmaciasSiman": {
                    "score": 0.7878787878787878,
                    "baseA": {
                        "key": "aliviol migrana",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "aliviol migrana tableta",
                        "quantities": [],
                        "precioUnitario": true
                    },
                    "price": 5.65
                }
            },
            "mayoritaryPrice": {
                "kielsa": {
                    "score": 0.896551724137931,
                    "baseA": {
                        "key": "aliviol migrana",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "aliviol migrana tab",
                        "quantities": [
                            "x48"
                        ],
                        "precioUnitario": false
                    },
                    "price": null
                },
                "farmaciasAhorro": {
                    "score": 0,
                    "baseA": {
                        "key": "ALIVIOL MIGRAÑA",
                        "quantities": []
                    },
                    "baseB": {
                        "key": "ALIVIOL MIGRAÑA",
                        "quantities": []
                    },
                    "price": 0
                },
                "farmaciasSiman": {
                    "score": 0.6153846153846154,
                    "baseA": {
                        "key": "aliviol migrana",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "aliviol caja migrana tabletas x",
                        "quantities": [
                            "48"
                        ],
                        "precioUnitario": false
                    },
                    "price": 291.6
                }
            },
            "kielsa": {
                "score": 0.896551724137931,
                "baseA": {
                    "key": "aliviol migrana",
                    "quantities": [],
                    "precioUnitario": false
                },
                "baseB": {
                    "key": "aliviol migrana tab",
                    "quantities": [
                        "x48"
                    ],
                    "precioUnitario": false
                }
            }
        }
    },
    "Antitusivo": {
        "ALICOL D": {
            "unitPrice": {
                "kielsa": {
                    "score": 0,
                    "baseA": {
                        "key": "ALICOL D",
                        "quantities": []
                    },
                    "baseB": {
                        "key": "ALICOL D",
                        "quantities": []
                    },
                    "price": 0
                },
                "farmaciasAhorro": {
                    "score": 0,
                    "baseA": {
                        "key": "ALICOL D",
                        "quantities": []
                    },
                    "baseB": {
                        "key": "ALICOL D",
                        "quantities": []
                    },
                    "price": 0
                },
                "farmaciasSiman": {
                    "score": 0.14814814814814814,
                    "baseA": {
                        "key": "alicol d",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "caplet fs mg naprox sodico",
                        "quantities": [
                            "550"
                        ],
                        "precioUnitario": true
                    },
                    "price": 22.18
                }
            },
            "mayoritaryPrice": {
                "kielsa": {
                    "score": 0.8,
                    "baseA": {
                        "key": "alicol d",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "alicol d jbe",
                        "quantities": [
                            "120ml"
                        ],
                        "precioUnitario": false
                    },
                    "price": null
                },
                "farmaciasAhorro": {
                    "score": 0.5,
                    "baseA": {
                        "key": "alicol d",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "alicol d frasco jarabe",
                        "quantities": [
                            "120ml"
                        ],
                        "precioUnitario": false
                    },
                    "price": 242.92
                },
                "farmaciasSiman": {
                    "score": 0.8,
                    "baseA": {
                        "key": "alicol d",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "alicol d ml x",
                        "quantities": [
                            "120"
                        ],
                        "precioUnitario": false
                    },
                    "price": 243.75
                }
            },
            "kielsa": {
                "score": 0.8,
                "baseA": {
                    "key": "alicol d",
                    "quantities": [],
                    "precioUnitario": false
                },
                "baseB": {
                    "key": "alicol d jbe",
                    "quantities": [
                        "120ml"
                    ],
                    "precioUnitario": false
                }
            }
        },
        "BRONCO PULMIN JBE": []
    },
    "Relajante muscular": {
        "ALIVIOL FLEX": {
            "unitPrice": {
                "kielsa": {
                    "score": 0,
                    "baseA": {
                        "key": "ALIVIOL FLEX",
                        "quantities": []
                    },
                    "baseB": {
                        "key": "ALIVIOL FLEX",
                        "quantities": []
                    },
                    "price": 0
                },
                "farmaciasAhorro": {
                    "score": 0.5517241379310345,
                    "baseA": {
                        "key": "aliviol flex",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "aliviol de fle tabletas",
                        "quantities": [
                            "36"
                        ],
                        "precioUnitario": true
                    },
                    "price": 13.01
                },
                "farmaciasSiman": {
                    "score": 0.7407407407407407,
                    "baseA": {
                        "key": "aliviol flex",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "aliviol flex tableta",
                        "quantities": [],
                        "precioUnitario": true
                    },
                    "price": 12.98
                }
            },
            "mayoritaryPrice": {
                "kielsa": {
                    "score": 0.8695652173913043,
                    "baseA": {
                        "key": "aliviol flex",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "aliviol flex tab",
                        "quantities": [
                            "x8"
                        ],
                        "precioUnitario": false
                    },
                    "price": null
                },
                "farmaciasAhorro": {
                    "score": 0,
                    "baseA": {
                        "key": "ALIVIOL FLEX",
                        "quantities": []
                    },
                    "baseB": {
                        "key": "ALIVIOL FLEX",
                        "quantities": []
                    },
                    "price": 0
                },
                "farmaciasSiman": {
                    "score": 0.6896551724137931,
                    "baseA": {
                        "key": "aliviol flex",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "aliviol flex tabletas x",
                        "quantities": [
                            "36"
                        ],
                        "precioUnitario": false
                    },
                    "price": 467.18
                }
            },
            "kielsa": {
                "score": 0.8695652173913043,
                "baseA": {
                    "key": "aliviol flex",
                    "quantities": [],
                    "precioUnitario": false
                },
                "baseB": {
                    "key": "aliviol flex tab",
                    "quantities": [
                        "x36"
                    ],
                    "precioUnitario": false
                }
            }
        },
        "DELOR FLEX": {
            "unitPrice": {
                "kielsa": {
                    "score": 0,
                    "baseA": {
                        "key": "DELOR FLEX",
                        "quantities": []
                    },
                    "baseB": {
                        "key": "DELOR FLEX",
                        "quantities": []
                    },
                    "price": 0
                },
                "farmaciasAhorro": {
                    "score": 0.6086956521739131,
                    "baseA": {
                        "key": "delor flex",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "de delor fle sobres",
                        "quantities": [
                            "50"
                        ],
                        "precioUnitario": true
                    },
                    "price": 18.25
                },
                "farmaciasSiman": {
                    "score": 0.7619047619047619,
                    "baseA": {
                        "key": "delor flex",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "delor flex sobre",
                        "quantities": [],
                        "precioUnitario": true
                    },
                    "price": 18.67
                }
            },
            "mayoritaryPrice": {
                "kielsa": {
                    "score": 0.8421052631578947,
                    "baseA": {
                        "key": "delor flex",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "delor flex tab",
                        "quantities": [
                            "x50"
                        ],
                        "precioUnitario": false
                    },
                    "price": null
                },
                "farmaciasAhorro": {
                    "score": 0,
                    "baseA": {
                        "key": "DELOR FLEX",
                        "quantities": []
                    },
                    "baseB": {
                        "key": "DELOR FLEX",
                        "quantities": []
                    },
                    "price": 0
                },
                "farmaciasSiman": {
                    "score": 0.6956521739130435,
                    "baseA": {
                        "key": "delor flex",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "delor flex sobres x",
                        "quantities": [
                            "50"
                        ],
                        "precioUnitario": false
                    },
                    "price": 933.44
                }
            },
            "kielsa": {
                "score": 0,
                "baseA": {
                    "key": "delor flex",
                    "quantities": [],
                    "precioUnitario": false
                },
                "baseB": {
                    "key": "precio unitario",
                    "quantities": [],
                    "precioUnitario": false
                }
            }
        }
    },
    "Antidiarreico": {
        "ALKA-D": [],
        "DIACOR": {
            "unitPrice": {
                "kielsa": {
                    "score": 0,
                    "baseA": {
                        "key": "DIACOR",
                        "quantities": []
                    },
                    "baseB": {
                        "key": "DIACOR",
                        "quantities": []
                    },
                    "price": 0
                },
                "farmaciasAhorro": {
                    "score": 0.5555555555555556,
                    "baseA": {
                        "key": "diacor",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "diacor tabletas",
                        "quantities": [],
                        "precioUnitario": true
                    },
                    "price": 7.14
                },
                "farmaciasSiman": {
                    "score": 0.5882352941176471,
                    "baseA": {
                        "key": "diacor",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "diacor tableta",
                        "quantities": [],
                        "precioUnitario": true
                    },
                    "price": 7.12
                }
            },
            "mayoritaryPrice": {
                "kielsa": {
                    "score": 0.7692307692307693,
                    "baseA": {
                        "key": "diacor",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "diacor tab",
                        "quantities": [
                            "2",
                            "0mg",
                            "x50"
                        ],
                        "precioUnitario": false
                    },
                    "price": null
                },
                "farmaciasAhorro": {
                    "score": 0.3333333333333333,
                    "baseA": {
                        "key": "diacor",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "dediacol frasco jarabe",
                        "quantities": [
                            "100ml"
                        ],
                        "precioUnitario": false
                    },
                    "price": 320.29
                },
                "farmaciasSiman": {
                    "score": 0.5263157894736842,
                    "baseA": {
                        "key": "diacor",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "diacor tabletas x",
                        "quantities": [
                            "50"
                        ],
                        "precioUnitario": false
                    },
                    "price": 356.21
                }
            },
            "kielsa": {
                "score": 0,
                "baseA": {
                    "key": "diacor",
                    "quantities": [],
                    "precioUnitario": false
                },
                "baseB": {
                    "key": "precio unitario",
                    "quantities": [],
                    "precioUnitario": false
                }
            }
        },
        "ENTEROGUANIL": {
            "unitPrice": {
                "kielsa": {
                    "score": 0,
                    "baseA": {
                        "key": "ENTEROGUANIL",
                        "quantities": []
                    },
                    "baseB": {
                        "key": "ENTEROGUANIL",
                        "quantities": []
                    },
                    "price": 0
                },
                "farmaciasAhorro": {
                    "score": 0.7857142857142857,
                    "baseA": {
                        "key": "enteroguanil",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "adulto enteroguanil",
                        "quantities": [],
                        "precioUnitario": true
                    },
                    "price": 0.92
                },
                "farmaciasSiman": {
                    "score": 0.7096774193548387,
                    "baseA": {
                        "key": "enteroguanil",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "adulto enteroguanil tab",
                        "quantities": [],
                        "precioUnitario": true
                    },
                    "price": 1.09
                }
            },
            "mayoritaryPrice": {
                "kielsa": {
                    "score": 0.48,
                    "baseA": {
                        "key": "enteroguanil",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "enterolan ml susp",
                        "quantities": [
                            "40",
                            "200mg",
                            "60ml"
                        ],
                        "precioUnitario": false
                    },
                    "price": null
                },
                "farmaciasAhorro": {
                    "score": 0.7333333333333333,
                    "baseA": {
                        "key": "enteroguanil",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "1de enteroguanil ninos",
                        "quantities": [
                            "200"
                        ],
                        "precioUnitario": false
                    },
                    "price": 0.84
                },
                "farmaciasSiman": {
                    "score": 0.6470588235294118,
                    "baseA": {
                        "key": "enteroguanil",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "adulto enteroguanil mg tab x",
                        "quantities": [
                            "100",
                            "200"
                        ],
                        "precioUnitario": false
                    },
                    "price": 203.28
                }
            },
            "kielsa": {
                "score": 0.08333333333333333,
                "baseA": {
                    "key": "enteroguanil",
                    "quantities": [],
                    "precioUnitario": false
                },
                "baseB": {
                    "key": "precio unitario",
                    "quantities": [],
                    "precioUnitario": false
                }
            }
        }
    },
    "Antiacido": {
        "ALKA-SETLZER": []
    },
    "Vitaminas": {
        "BACADOL INFANTIL": {
            "unitPrice": {
                "kielsa": {
                    "score": 0,
                    "baseA": {
                        "key": "BACADOL INFANTIL",
                        "quantities": []
                    },
                    "baseB": {
                        "key": "BACADOL INFANTIL",
                        "quantities": []
                    },
                    "price": 0
                },
                "farmaciasAhorro": {
                    "score": 0,
                    "baseA": {
                        "key": "BACADOL INFANTIL",
                        "quantities": []
                    },
                    "baseB": {
                        "key": "BACADOL INFANTIL",
                        "quantities": []
                    },
                    "price": 0
                },
                "farmaciasSiman": {
                    "score": 0.6451612903225806,
                    "baseA": {
                        "key": "bacadol infantil",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "infantil panadol tab",
                        "quantities": [],
                        "precioUnitario": true
                    },
                    "price": 2.97
                }
            },
            "mayoritaryPrice": {
                "kielsa": {
                    "score": 0.9032258064516129,
                    "baseA": {
                        "key": "bacadol infantil",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "bacadol infantil jbe",
                        "quantities": [
                            "120ml"
                        ],
                        "precioUnitario": false
                    },
                    "price": null
                },
                "farmaciasAhorro": {
                    "score": 0.8235294117647058,
                    "baseA": {
                        "key": "bacadol infantil",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "bacadol infantil jarabe",
                        "quantities": [
                            "120ml"
                        ],
                        "precioUnitario": false
                    },
                    "price": 111.42
                },
                "farmaciasSiman": {
                    "score": 0.48,
                    "baseA": {
                        "key": "bacadol infantil",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "bacadol jbe ml",
                        "quantities": [
                            "250"
                        ],
                        "precioUnitario": false
                    },
                    "price": 111.94
                }
            },
            "kielsa": {
                "score": 0.9032258064516129,
                "baseA": {
                    "key": "bacadol infantil",
                    "quantities": [],
                    "precioUnitario": false
                },
                "baseB": {
                    "key": "bacadol infantil jbe",
                    "quantities": [
                        "120ml"
                    ],
                    "precioUnitario": false
                }
            }
        },
        "BACADOL JBE": [],
        "CERENERVON": {
            "unitPrice": {
                "kielsa": {
                    "score": 0,
                    "baseA": {
                        "key": "CERENERVON",
                        "quantities": []
                    },
                    "baseB": {
                        "key": "CERENERVON",
                        "quantities": []
                    },
                    "price": 0
                },
                "farmaciasAhorro": {
                    "score": 0.6206896551724138,
                    "baseA": {
                        "key": "cerenervon",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "cerenervon sobres ultra",
                        "quantities": [],
                        "precioUnitario": true
                    },
                    "price": 20.25
                },
                "farmaciasSiman": {
                    "score": 0.75,
                    "baseA": {
                        "key": "cerenervon",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "cerenervon fco jbe",
                        "quantities": [
                            "250ml"
                        ],
                        "precioUnitario": true
                    },
                    "price": 114.48
                }
            },
            "mayoritaryPrice": {
                "kielsa": {
                    "score": 1,
                    "baseA": {
                        "key": "cerenervon",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "cerenervon",
                        "quantities": [
                            "250ml"
                        ],
                        "precioUnitario": false
                    },
                    "price": null
                },
                "farmaciasAhorro": {
                    "score": 0.6923076923076923,
                    "baseA": {
                        "key": "cerenervon",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "capsulas cerenervon",
                        "quantities": [
                            "32"
                        ],
                        "precioUnitario": false
                    },
                    "price": 157.22
                },
                "farmaciasSiman": {
                    "score": 0.782608695652174,
                    "baseA": {
                        "key": "cerenervon",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "cerenervon kids x",
                        "quantities": [
                            "120ml"
                        ],
                        "precioUnitario": false
                    },
                    "price": 197.6
                }
            },
            "kielsa": {
                "score": 0.72,
                "baseA": {
                    "key": "cerenervon",
                    "quantities": [],
                    "precioUnitario": false
                },
                "baseB": {
                    "key": "cerenervon jbe kids",
                    "quantities": [
                        "120ml"
                    ],
                    "precioUnitario": false
                }
            }
        },
        "CERENERVON CAPSULAS": [],
        "CERENERVON KIDS": {
            "unitPrice": {
                "kielsa": {
                    "score": 0,
                    "baseA": {
                        "key": "CERENERVON KIDS",
                        "quantities": []
                    },
                    "baseB": {
                        "key": "CERENERVON KIDS",
                        "quantities": []
                    },
                    "price": 0
                },
                "farmaciasAhorro": {
                    "score": 0,
                    "baseA": {
                        "key": "CERENERVON KIDS",
                        "quantities": []
                    },
                    "baseB": {
                        "key": "CERENERVON KIDS",
                        "quantities": []
                    },
                    "price": 0
                },
                "farmaciasSiman": {
                    "score": 0.6428571428571429,
                    "baseA": {
                        "key": "cerenervon kids",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "cerenervon fco jbe",
                        "quantities": [
                            "250ml"
                        ],
                        "precioUnitario": true
                    },
                    "price": 114.48
                }
            },
            "mayoritaryPrice": {
                "kielsa": {
                    "score": 0.8275862068965517,
                    "baseA": {
                        "key": "cerenervon kids",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "cerenervon jbe kids",
                        "quantities": [
                            "120ml"
                        ],
                        "precioUnitario": false
                    },
                    "price": null
                },
                "farmaciasAhorro": {
                    "score": 0.631578947368421,
                    "baseA": {
                        "key": "cerenervon kids",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "cerenervon frasco jarabe kids",
                        "quantities": [
                            "120ml"
                        ],
                        "precioUnitario": false
                    },
                    "price": 193.71
                },
                "farmaciasSiman": {
                    "score": 0.9629629629629629,
                    "baseA": {
                        "key": "cerenervon kids",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "cerenervon kids x",
                        "quantities": [
                            "120ml"
                        ],
                        "precioUnitario": false
                    },
                    "price": 197.6
                }
            },
            "kielsa": {
                "score": 0.8275862068965517,
                "baseA": {
                    "key": "cerenervon kids",
                    "quantities": [],
                    "precioUnitario": false
                },
                "baseB": {
                    "key": "cerenervon jbe kids",
                    "quantities": [
                        "120ml"
                    ],
                    "precioUnitario": false
                }
            }
        },
        "ENERGIL": {
            "unitPrice": {
                "kielsa": {
                    "score": 0,
                    "baseA": {
                        "key": "ENERGIL",
                        "quantities": []
                    },
                    "baseB": {
                        "key": "ENERGIL",
                        "quantities": []
                    },
                    "price": 0
                },
                "farmaciasAhorro": {
                    "score": 0,
                    "baseA": {
                        "key": "ENERGIL",
                        "quantities": []
                    },
                    "baseB": {
                        "key": "ENERGIL",
                        "quantities": []
                    },
                    "price": 0
                },
                "farmaciasSiman": {
                    "score": 0.3076923076923077,
                    "baseA": {
                        "key": "energil",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "active denk energy sobre",
                        "quantities": [],
                        "precioUnitario": true
                    },
                    "price": 54.72
                }
            },
            "mayoritaryPrice": {
                "kielsa": {
                    "score": 0.8,
                    "baseA": {
                        "key": "energil",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "energil jbe",
                        "quantities": [
                            "250ml"
                        ],
                        "precioUnitario": false
                    },
                    "price": null
                },
                "farmaciasAhorro": {
                    "score": 0.4444444444444444,
                    "baseA": {
                        "key": "energil",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "con energil frasco hierro",
                        "quantities": [
                            "250ml"
                        ],
                        "precioUnitario": false
                    },
                    "price": 120.9
                },
                "farmaciasSiman": {
                    "score": 0.8571428571428571,
                    "baseA": {
                        "key": "energil",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "energil ml",
                        "quantities": [
                            "250"
                        ],
                        "precioUnitario": false
                    },
                    "price": 119.68
                }
            },
            "kielsa": {
                "score": 0.8,
                "baseA": {
                    "key": "energil",
                    "quantities": [],
                    "precioUnitario": false
                },
                "baseB": {
                    "key": "energil jbe",
                    "quantities": [
                        "250ml"
                    ],
                    "precioUnitario": false
                }
            }
        }
    },
    "Laxante": {
        "CITROLAX": {
            "unitPrice": {
                "kielsa": {
                    "score": 0,
                    "baseA": {
                        "key": "CITROLAX",
                        "quantities": []
                    },
                    "baseB": {
                        "key": "CITROLAX",
                        "quantities": []
                    },
                    "price": 0
                },
                "farmaciasAhorro": {
                    "score": 0,
                    "baseA": {
                        "key": "CITROLAX",
                        "quantities": []
                    },
                    "baseB": {
                        "key": "CITROLAX",
                        "quantities": []
                    },
                    "price": 0
                },
                "farmaciasSiman": {
                    "score": 0,
                    "baseA": {
                        "key": "CITROLAX",
                        "quantities": []
                    },
                    "baseB": {
                        "key": "CITROLAX",
                        "quantities": []
                    },
                    "price": 0
                }
            },
            "mayoritaryPrice": {
                "kielsa": {
                    "score": 0.8235294117647058,
                    "baseA": {
                        "key": "citrolax",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "citrolax fco",
                        "quantities": [
                            "250ml"
                        ],
                        "precioUnitario": false
                    },
                    "price": null
                },
                "farmaciasAhorro": {
                    "score": 0.5,
                    "baseA": {
                        "key": "citrolax",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "citrolax frasco limonada",
                        "quantities": [
                            "250ml"
                        ],
                        "precioUnitario": false
                    },
                    "price": 113.52
                },
                "farmaciasSiman": {
                    "score": 0.6363636363636364,
                    "baseA": {
                        "key": "citrolax",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "citrolax original",
                        "quantities": [
                            "250ml"
                        ],
                        "precioUnitario": false
                    },
                    "price": 116.42
                }
            },
            "kielsa": {
                "score": 0.8235294117647058,
                "baseA": {
                    "key": "citrolax",
                    "quantities": [],
                    "precioUnitario": false
                },
                "baseB": {
                    "key": "citrolax fco",
                    "quantities": [
                        "250ml"
                    ],
                    "precioUnitario": false
                }
            }
        },
        "ELCOTT": {
            "unitPrice": {
                "kielsa": {
                    "score": 0.30303030303030304,
                    "baseA": {
                        "key": "elcott",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "disp elcott laxante magnesia sob x",
                        "quantities": [
                            "12g",
                            "24"
                        ],
                        "precioUnitario": true
                    },
                    "price": null
                },
                "farmaciasAhorro": {
                    "score": 0.3125,
                    "baseA": {
                        "key": "elcott",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "aromatizada elcott magnesia sob",
                        "quantities": [],
                        "precioUnitario": true
                    },
                    "price": 13.3
                },
                "farmaciasSiman": {
                    "score": 0.43478260869565216,
                    "baseA": {
                        "key": "elcott",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "elcott magnesia sobre",
                        "quantities": [],
                        "precioUnitario": true
                    },
                    "price": 16.45
                }
            },
            "mayoritaryPrice": {
                "kielsa": {
                    "score": 0,
                    "baseA": {
                        "key": "ELCOTT",
                        "quantities": []
                    },
                    "baseB": {
                        "key": "ELCOTT",
                        "quantities": []
                    },
                    "price": 0
                },
                "farmaciasAhorro": {
                    "score": 0,
                    "baseA": {
                        "key": "ELCOTT",
                        "quantities": []
                    },
                    "baseB": {
                        "key": "ELCOTT",
                        "quantities": []
                    },
                    "price": 0
                },
                "farmaciasSiman": {
                    "score": 0.4,
                    "baseA": {
                        "key": "elcott",
                        "quantities": [],
                        "precioUnitario": false
                    },
                    "baseB": {
                        "key": "elcott magnesia sobres x",
                        "quantities": [
                            "24"
                        ],
                        "precioUnitario": false
                    },
                    "price": 344.12
                }
            },
            "kielsa": {
                "score": 0.30303030303030304,
                "baseA": {
                    "key": "elcott",
                    "quantities": [],
                    "precioUnitario": false
                },
                "baseB": {
                    "key": "disp elcott laxante magnesia sob x",
                    "quantities": [
                        "12g",
                        "24"
                    ],
                    "precioUnitario": true
                }
            }
        }
    },
    "Crema muscular": {
        "COFAL FUERTE 120G": [],
        "COFAL FUERTE 60g": [],
        "COFAL ORIGINAL 120g": [],
        "COFAL ORIGINAL 35g": [],
        "COFAL ORIGINAL 60G": [],
        "Frotal 120g": []
    },
    "Analgesico Mujer": {
        "D´MUJER  100 tab": []
    }
}

// --- 3. Componentes UI ---

const PriceCard: React.FC<{ product: NormalizedProduct }> = ({ product }) => {
  const formatMoney = (amount: number) => {
    if (!amount || amount === 0) return <span className="text-gray-300 text-xs">N/D</span>;
    return <span className="font-bold text-slate-800">L. {amount.toFixed(2)}</span>;
  };

  // Calcular precio mínimo unitario válido (> 0)
  const validPrices = product.prices.map(p => p.unitPrice).filter(p => p > 0);
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            <Tag className="w-3 h-3 mr-1" />
            {product.category}
          </span>
        </div>
        <h3 className="text-lg font-bold text-slate-800 leading-snug truncate" title={product.name}>
          {product.name}
        </h3>
      </div>

      {/* Tabla de precios */}
      <div className="p-4 flex-1">
        <div className="grid grid-cols-12 gap-2 text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-3 border-b border-slate-100 pb-2">
          <div className="col-span-4">Farmacia</div>
          <div className="col-span-4 text-right">Unitario</div>
          <div className="col-span-4 text-right">Mayorista</div>
        </div>

        <div className="space-y-3">
          {product.prices.map((priceInfo) => {
            const isBestPrice = minPrice !== null && priceInfo.unitPrice === minPrice;
            
            return (
              <div 
                key={priceInfo.pharmacy} 
                className={`grid grid-cols-12 items-center gap-2 text-sm ${isBestPrice ? 'bg-emerald-50/60 -mx-2 px-2 py-1.5 rounded-md' : ''}`}
              >
                <div className="col-span-4 font-medium text-slate-600 capitalize truncate">
                  {priceInfo.pharmacy.replace('farmacias', '')}
                </div>
                
                <div className="col-span-4 text-right">
                  <div className="flex flex-col items-end">
                    {formatMoney(priceInfo.unitPrice)}
                    {isBestPrice && (
                      <span className="text-[9px] leading-none text-emerald-600 font-bold bg-emerald-100 px-1 py-0.5 rounded mt-0.5">
                        MEJOR
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="col-span-4 text-right text-slate-500">
                  {formatMoney(priceInfo.wholesalePrice)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default function PharmaDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Transformación de datos usando useMemo para rendimiento
  const normalizedData = useMemo<NormalizedProduct[]>(() => {
    const products: NormalizedProduct[] = [];

    Object.entries(RAW_DATA).forEach(([category, productsObj]) => {
      Object.entries(productsObj).forEach(([prodName, details]) => {
        // TypeScript Guard: Verificamos si es un array (vacío/inválido) o un objeto válido
        if (Array.isArray(details) || !details.unitPrice) {
          return;
        }

        // Obtener lista única de farmacias presentes en unitPrice o mayoritaryPrice
        const pharmacyKeys = new Set([
          ...Object.keys(details.unitPrice || {}),
          ...Object.keys(details.mayoritaryPrice || {})
        ]);

        const priceList = Array.from(pharmacyKeys).map(key => ({
          pharmacy: key,
          unitPrice: details.unitPrice?.[key]?.price || 0,
          wholesalePrice: details.mayoritaryPrice?.[key]?.price || 0
        }));

        products.push({
          id: `${category}-${prodName}`,
          category,
          name: prodName,
          prices: priceList
        });
      });
    });

    return products;
  }, []);

  // Filtrado
  const filteredItems = normalizedData.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginación
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Comparador de Precios</h1>
            <p className="text-slate-500 mt-2">Analiza y encuentra la mejor opción entre farmacias.</p>
          </div>
          
          <div className="relative w-full md:w-80 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Buscar medicamento o categoría..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Content Grid */}
        {paginatedItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {paginatedItems.map((product) => (
              <PriceCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="bg-slate-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No se encontraron productos</h3>
            <p className="text-slate-500">Intenta ajustar tu búsqueda.</p>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <span className="text-sm font-medium text-slate-600">
              Página <span className="text-slate-900 font-bold">{currentPage}</span> de {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}