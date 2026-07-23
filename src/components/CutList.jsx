export default function CutList({
  widthCm,
  heightCm,
  depthCm,
  doors,
  shelves
}) {


  const doorWidth = widthCm / doors;


  return (

    <div
      style={{
        marginTop:"20px",
        padding:"10px",
        background:"#fff",
        borderRadius:"5px",
        fontSize:"14px"
      }}
    >

      <h3>
        📋 Lista de corte
      </h3>


      <p>
        <b>Ropero:</b> {widthCm} x {heightCm} x {depthCm} cm
      </p>


      <hr/>


      <p>
        🪵 Laterales:
        <br/>
        2 piezas
        <br/>
        {heightCm} x {depthCm} cm
      </p>


      <p>
        🪵 Tapa superior:
        <br/>
        1 pieza
        <br/>
        {widthCm} x {depthCm} cm
      </p>


      <p>
        🪵 Base:
        <br/>
        1 pieza
        <br/>
        {widthCm} x {depthCm} cm
      </p>



      <p>
        🚪 Puertas:
        <br/>
        {doors} piezas
        <br/>
        {doorWidth.toFixed(1)} x {heightCm} cm
      </p>



      <p>
        📚 Repisas:
        <br/>
        {shelves} piezas
        <br/>
        {widthCm - 10} x {depthCm} cm
      </p>


    </div>

  );

}