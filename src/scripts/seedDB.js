
const { User } = require('../models/index');
const bcrypt = require("bcryptjs");
const Permission = require('../models/permission.model');
const UserPermission = require('../models/userpermission.model');
const status = require('http-status');
const { success } = require('../utils/Error');
const createAdminUser = async () => {
  const adminUser = {
    firstName: "Admin",
    lastName: "Admin",
    email: "admin@gmail.com",
    password: bcrypt.hashSync("Password@1", 8),
    phone: "03244323453",
    userType: "admin",
  };
  const user = await User.create(adminUser);
  let permissions = [
    {
      userId: user.id,
      permissionId: 1,
      name: "User Management"
    },
    {
      userId: user.id,
      permissionId: 2,
      name: "Admin Management"
    },
    {
      userId: user.id,
      permissionId: 3,
      name: "Notification Management"
    },
    {
      userId: user.id,
      permissionId: 4,
      name: "Chat Management"
    }
  ]
  var addedpermission = await UserPermission.bulkCreate(permissions)
}

const createAdminPermissions = async () => {
  let permissions = [
    {
      name: "User Management"
    },
    {
      name: "Admin Management"
    },
    {
      name: "Notification Management"
    }
  ]
  try {
    await Permission.bulkCreate(permissions)

  } catch (error) {
    console.log("ERROR..", error)

  }

}


const seedDB = async () => {
  try {
    // await createAdminPermissions().then(async(response)=>{
    //     await createAdminUser();
    //   }
    await createAdminUser().then(response => {
      console.log("admin created..")
    })
      .catch(error => {
        console.log("ERROR..", error)

      })
  } catch (error) {
    console.log('There is some error in seeding database', error)
  }
}

seedDB()

