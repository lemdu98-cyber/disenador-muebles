export default function MaterialCost({
  widthCm,
  heightCm,
  depthCm,
  doors,
  shelves
}) {


  // Área aproximada de piezas
  const sides =
    2 * (heightCm * depthCm);

  const topBottom =
    2 * (widthCm * depthCm);

  const doorsArea =
    doors * ((widthCm / doors) * heightCm);


  const shelvesArea =
    shelves * ((widthCm - 10) * depthCm);


  const totalArea =
    (sides + topBottom + doorsArea + shelvesArea) / 10000;


  // Precio ejemplo melamina
  const pricePerM2 = 120;


  const materialCost =
    totalArea * pricePerM2;


  return (

    <div
      style={{
        marginTop:"20px",
        padding:"10px",
        background:"#fff",
        borderRadius:"5px"
      }}
    >

      <h3>
        💰 Materiales
      </h3>


      <p>
        Área aproximada:
        <br/>
        {totalArea.toFixed(2)} m²
      </p>


      <p>
        Costo melamina:
        <br/>
        {materialCost.toFixed(0)} Bs
      </p>


      <p>
        Bisagras:
        <br/>
        {doors * 4} unidades
      </p>


      <p>
        Tornillos:
        <br/>
        Aproximadamente 50 unidades
      </p>


    </div>

  );

}