"use client";

import { useCart } from "@/lib/context/CartContext";

interface ItemPromo {
  id: string;
  nombre: string;
  categoria: string;
  precioOriginal: number;
  precioOferta?: number;
  descuentoPorcentaje?: number;
  esNovedad?: boolean;
  descripcion: string;
}

const PRODUCTOS_DESTACADOS: ItemPromo[] = [
  {
    id: "promo-1",
    nombre: "Resaltadores Pastel Trabi x 6",
    categoria: "Librería",
    precioOriginal: 8500,
    precioOferta: 6800,
    descuentoPorcentaje: 20,
    esNovedad: false,
    descripcion: "Gama pastel completa, punta biselada para estudio y oficina.",
  },
  {
    id: "promo-2",
    nombre: "Cuaderno Universitario A4 100hj",
    categoria: "Librería",
    precioOriginal: 5200,
    precioOferta: 4400,
    descuentoPorcentaje: 15,
    esNovedad: true,
    descripcion: "Tapa semi rígida micropuntillado, hojas de 75g de alta opacidad.",
  },
  {
    id: "promo-3",
    nombre: "Pack Apuntes x 300 hojas Simple Faz",
    categoria: "Copistería Express",
    precioOriginal: 16500,
    precioOferta: 13900,
    descuentoPorcentaje: 16,
    esNovedad: true,
    descripcion: "Ideal para parciales o manuales con entrega express en el día.",
  },
  {
    id: "promo-4",
    nombre: "Set Geometría Cristal Profesional",
    categoria: "Técnico",
    precioOriginal: 4900,
    precioOferta: 3900,
    descuentoPorcentaje: 20,
    esNovedad: false,
    descripcion: "Regla 30cm, escuadras 45° y 60°, semicírculo de alta precisión.",
  },
];

export default function NovedadesOfertas({
  onProductoAgregado,
}: {
  onProductoAgregado?: (nombre: string) => void;
}) {
  const { agregarProducto } = useCart();

  const handleAgregar = (prod: ItemPromo) => {
    agregarProducto({
      id: prod.id,
      nombre: prod.nombre,
      precio: prod.precioOferta || prod.precioOriginal,
      categoria: prod.categoria,
    });
    if (onProductoAgregado) {
      onProductoAgregado(prod.nombre);
    }
  };

  return (
    <section className="max-w-5xl mx-auto px-4 pb-20">
      <div className="text-center mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-teal-600 bg-teal-50 border border-teal-200 px-4 py-1.5 rounded-full">
          Precios Especiales
        </span>
        <h3 className="text-2xl font-black text-stone-900 mt-3">
          Novedades y Ofertas de la Semana
        </h3>
        <p className="text-xs text-stone-500 mt-1">
          Descuentos para retirar en el local del centro o recibir por envío
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
        {PRODUCTOS_DESTACADOS.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  {item.categoria}
                </span>

                <div className="flex items-center gap-1">
                  {item.esNovedad && (
                    <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold">
                      Nuevo
                    </span>
                  )}
                  {item.descuentoPorcentaje && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                      {item.descuentoPorcentaje}% OFF
                    </span>
                  )}
                </div>
              </div>

              <h4 className="font-bold text-stone-800 text-sm leading-snug">
                {item.nombre}
              </h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                {item.descripcion}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-stone-100 flex items-end justify-between">
              <div>
                {item.precioOferta ? (
                  <>
                    <span className="text-[11px] text-stone-400 line-through block">
                      ${item.precioOriginal.toLocaleString("es-AR")}
                    </span>
                    <span className="text-base font-bold text-teal-600">
                      ${item.precioOferta.toLocaleString("es-AR")}
                    </span>
                  </>
                ) : (
                  <span className="text-base font-bold text-stone-800">
                    ${item.precioOriginal.toLocaleString("es-AR")}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleAgregar(item)}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-xl transition-all active:scale-95"
              >
                + Agregar
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}