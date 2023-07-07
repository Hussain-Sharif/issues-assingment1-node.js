const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initialize = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is started at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB error at ${error}`);
    process.exit(1);
  }
};
initialize();

//CONVERT to camel_Case
const convert = (each) => {
  return {
    id: each.id,
    todo: each.todo,
    priority: each.priority,
    status: each.status,
    category: each.category,
    dueDate: each.due_date,
  };
};

//Middleware ==>middle1 function
const middle1 = (request, response, next) => {
  let { status, priority, category, date } = request.query;
  const check_undefined = (each) => each === undefined;
  if ([status, priority, category, date].every(check_undefined)) {
    let { status } = request.body;
    let { priority } = request.body;
    let { category } = request.body;
    const { dueDate } = request.body;
    date = dueDate;
    console.log(priority);
    if (
      priority !== undefined &&
      ["HIGH", "MEDIUM", "LOW"].includes(priority) === false
    ) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else if (
      status !== undefined &&
      ["TO DO", "IN PROGRESS", "DONE"].includes(status) === false
    ) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else if (
      category !== undefined &&
      ["WORK", "HOME", "LEARNING"].includes(category) === false
    ) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else if (date !== undefined && isValid(new Date(date)) === false) {
      response.status(400);
      response.send("Invalid Due Date");
    } else {
      console.log(["HIGH", "MEDIUM", "LOW"].includes(priority));
      next();
    }
  } else {
    if (
      priority !== undefined &&
      ["HIGH", "MEDIUM", "LOW"].includes(priority) === false
    ) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else if (
      status !== undefined &&
      ["TO DO", "IN PROGRESS", "DONE"].includes(status) === false
    ) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else if (
      category !== undefined &&
      ["WORK", "HOME", "LEARNING"].includes(category) === false
    ) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else if (date !== undefined && isValid(new Date(date)) === false) {
      response.status(400);
      response.send("Invalid Due Date");
    } else {
      console.log(["HIGH", "MEDIUM", "LOW"].includes(priority));
      next();
    }
  }
};

//API 1
app.get("/todos/", middle1, async (request, response) => {
  const { status, priority, search_q, category } = request.query;
  if (status !== undefined && priority !== undefined) {
    const gQuery = `
            SELECT * FROM todo 
            WHERE 
                status='${status}' AND priority='${priority}';
        `;
    const gResult = await db.all(gQuery);
    response.send(gResult.map((each) => convert(each)));
  } else if (priority !== undefined && category !== undefined) {
    const gQuery = `
            SELECT * FROM todo
            WHERE priority='${priority}' AND category='${category}';
        `;
    const gResult = await db.all(gQuery);
    response.send(gResult.map((each) => convert(each)));
  } else if (status !== undefined && category !== undefined) {
    const gQuery = `
            SELECT * FROM todo 
            WHERE 
                status='${status}' AND category='${category}';
        `;
    const gResult = await db.all(gQuery);
    response.send(gResult.map((each) => convert(each)));
  } else if (category !== undefined) {
    const gQuery = `
            SELECT * FROM todo 
            WHERE 
                category='${category}';
        `;
    const gResult = await db.all(gQuery);
    response.send(gResult.map((each) => convert(each)));
  } else if (status !== undefined) {
    const gQuery = `
            SELECT * FROM todo 
            WHERE 
                status='${status}';
        `;
    const gResult = await db.all(gQuery);
    response.send(gResult.map((each) => convert(each)));
  } else if (priority !== undefined) {
    const gQuery = `
            SELECT * FROM todo 
            WHERE 
                priority='${priority}';
        `;
    const gResult = await db.all(gQuery);
    response.send(gResult.map((each) => convert(each)));
  } else {
    const gQuery = `
           SELECT * FROM todo 
            WHERE 
                todo LIKE '%${search_q}%';
        `;
    const gResult = await db.all(gQuery);
    response.send(gResult.map((each) => convert(each)));
  }
});

//API 2
app.get("/todos/:todoId/", middle1, async (request, response) => {
  const { todoId } = request.params;
  const gQ = `
        SELECT * FROM todo
        WHERE id='${todoId}';
    `;
  const gR = await db.get(gQ);
  response.send(convert(gR));
});

//API 3
app.get("/agenda/", middle1, async (request, response) => {
  const { date } = request.query;
  const dateList = date.split("-");
  const fResult = format(
    new Date(
      parseInt(dateList[0]),
      parseInt(dateList[1]) - 1,
      parseInt(dateList[2])
    ),
    "yyyy-MM-dd"
  );
  //console.log(fResult);
  const gQuery = `
          SELECT * FROM todo
          WHERE due_date='${fResult}';
      `;
  const gR = await db.all(gQuery);
  response.send(gR.map((each) => convert(each)));
});

//API 4
app.post("/todos/", middle1, async (request, response) => {
  const { id, todo, status, priority, dueDate, category } = request.body;
  const pQuery = `
        INSERT INTO todo(id,todo,priority,status,category,due_date)
        VALUES('${id}','${todo}','${priority}','${status}','${category}','${dueDate}');
    `;
  await db.run(pQuery);
  response.send("Todo Successfully Added");
});

//API 5
app.put("/todos/:todoId/", middle1, async (request, response) => {
  const { todoId } = request.params;
  const { id, todo, status, priority, dueDate, category } = request.body;
  console.log(new Date(dueDate));
  if (status !== undefined) {
    const putQuery = `
            UPDATE todo 
            SET 
                status='${status}'
            WHERE id='${todoId}';
        `;
    await db.run(putQuery);
    response.send("Status Updated");
  } else if (priority !== undefined) {
    const putQuery = `
            UPDATE todo 
            SET 
                priority='${priority}'
            WHERE id='${todoId}';
        `;
    await db.run(putQuery);
    response.send("Priority Updated");
  } else if (todo !== undefined) {
    const putQuery = `
            UPDATE todo 
            SET 
                todo='${todo}'
            WHERE id='${todoId}';
        `;
    await db.run(putQuery);
    response.send("Todo Updated");
  } else if (category !== undefined) {
    const putQuery = `
            UPDATE todo 
            SET 
                category='${category}'
            WHERE id='${todoId}';
        `;
    await db.run(putQuery);
    response.send("Category Updated");
  } else {
    const putQuery = `
            UPDATE todo 
            SET 
                due_date='${dueDate}'
            WHERE id='${todoId}';
        `;
    await db.run(putQuery);
    response.send("Due Date Updated");
  }
});

//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const dQuery = `
        DELETE FROM todo WHERE id='${todoId}';
    `;
  await db.run(dQuery);
  response.send("Todo Deleted");
});

module.exports = app;
