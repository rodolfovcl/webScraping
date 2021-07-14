const request = require('request')
const requestPromise = require('request-promise')
const cheerio = require('cheerio')
const fs = require('fs')
const { Parser } = require('json2csv')
const jexcel = require('json2excel')


let empresas = []
let paginacion = []
let objDatosObtenidosScraped = []

const inicioScraping = async () => {
  try {
    //? 1- Get request para traer el html de la pagina
    let respuesta = await requestPromise('https://chileservicios.com/industrias/tecnologias-de-la-informacion/')
    let $ = cheerio.load(respuesta)
    const numeroDePags = parseInt($('ul.pagination > li').last().prev().find('a').text()) // Penultitimo elemento
    console.clear()
    console.log('Número de paginas a recorrer:', numeroDePags)

    // Cargo total de links de paginas desde la paginacion
    for (let i = 0; i < numeroDePags; i++) {
      paginacion.push(`https://chileservicios.com/industrias/tecnologias-de-la-informacion/page/${i+1}`)
    }

    setTimeout(() => { console.log('Obteniendo número de empresas...') }, 1000)

    //? 2- Consulto link de cada empresa y los argo en array empresas
    for (let url of paginacion) {
      respuesta = await requestPromise(url)
      $ = await cheerio.load(respuesta)
      let linkEmpresa = $('div[class="card-body"] > a')

      $(linkEmpresa).each(function () {
        empresas.push($(this).attr('href'))
      })
    }
    // console.log(`Hay ${} links de empresas para obtener informacin`)
    console.log('Número de empresas: ', parseInt(empresas.length), '\n')

    //? 3- Scraped data: Obtendo los datos de cada empresa
    console.log('Iniciando scraping...\n')
    for (let empresa of empresas) {
      respuesta = await requestPromise(empresa)
      $ = await cheerio.load(respuesta)
      let nombre = $('div[class="card-header"] > h1').text()
      let descripcion = $('div[class="card-body"] > div[class="row"] > div[class="col-md-8 my-2"]').text().trim()
      let telefono = $('#page > div > div > div.col-lg-4.my-2 > div > div > p:nth-child(2)').text().trim()//.replace(' ', '')
      let correo = $('#page > div > div > div.col-lg-4.my-2 > div > div > p:nth-child(3)').text().trim()
      let sitioWeb = $('#page > div > div > div.col-lg-4.my-2 > div > div > p:nth-child(4)').text().trim()

      // Creo objetos de cada empresa con sus respectivos datos
      // objDatosObtenidosScraped.push({ nombre: nombre, descripcion: descripcion, telefono: telefono, correo: correo, sitioWeb: sitioWeb })
      objDatosObtenidosScraped.push({ nombre, descripcion, telefono, correo, sitioWeb })

      // Creo JSON con datos de las empresas
      let datos = JSON.stringify(objDatosObtenidosScraped)
      fs.writeFileSync('empresas.json', datos)
      console.log(`${nombre} scraped ✔️`)

    }
    // Creacion del csv
    crearCsv(objDatosObtenidosScraped)

    // Creo archivo excel
    crearExcel(objDatosObtenidosScraped)

  } catch (error) {
    console.log('error: ', error)
  }
}

const crearCsv = (datos) => {
  /*https://www.npmjs.com/package/json2csv*/
  const campos = ['nombre', 'descripcion', 'telefono', 'correo', 'sitioWeb']
  // Creo instancia del json2csv
  const json2csvParse = new Parser({
    fields: campos,
    defaultValue: "Sin información"
  })
  const csv = json2csvParse.parse(datos)
  fs.writeFileSync('./empresas.csv', csv, 'utf-8')
  console.log('\nArchcivo json2csv creado correctamente 🧾')
}

const crearExcel = (datos) => {
  /*https://www.npmjs.com/package/json2excel*/
  let data = {
    sheets: [{
      header: {
        'nombre': 'nombre',
        'descripcion': 'descripcion',
        'telefono': 'telefono',
        'correo': 'correo',
        'sitioWeb': 'sitioWeb'
      },
      items: datos,
      sheetName: 'sheet1',
    }],
    filepath: 'empresas.xlsx'
  }
  // Ejecuto creacion de excel
  jexcel.j2e(data,function(err) {
    if (err) console.log('err: ', err)
    else console.log('Archivo json2excel creado: empresas.xlsx 📊')
  })
}

//! Ejecuto funcion principal para realizar el scraping
inicioScraping()