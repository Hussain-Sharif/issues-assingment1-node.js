const format = require("date-fns/format");
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

//API 1
app.get("/todos/", async (request, response) => {
  const { status, priority, search_q, category } = request.query;
  const gQuery = `
        SELECT * 
        FROM todo
        WHERE ((category='${category}' AND 
        priority='${priority}') OR 
        (category='${category}' AND status='${status}') OR  
        (category='${category}')  OR 
        (todo LIKE '%${search_q}%') OR 
        (status='${status}') OR (priority='${priority}') OR 
        (priority='${priority}' AND status='${status}'));
    `;
  const gResult = await db.all(gQuery);
  response.send(gResult.map((each) => convert(each)));
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const gQ = `
        SELECT * FROM todo
        WHERE id='${todoId}';
    `;
  const gR = await db.get(gQ);
  response.send(convert(gR));
});

//API 3
app.get("/agenda/", async (request, response) => {
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
app.post("/todos/", async (request, response) => {
  const { id, todo, status, priority, dueDate, category } = request.query;
  const pQuery = `
        INSERT INTO todo(id,todo,priority,status,category,due_date)
        VALUES('${id}','${todo}','${priority}','${status}','${category}','${dueDate}');
    `;
  await db.run(pQuery);
  response.send("Todo Successfully Added");
});

//API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { id, todo, status, priority, dueDate, category } = request.query;
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
        DELETE TABLE todo WHERE id='${todoId}';
    `;
  await db.run(dQuery);
  response.send("Todo Deleted");
});

module.exports = app;
