document
.getElementById("applicationForm")
.addEventListener("submit", async(e)=>{


e.preventDefault();


const supabase = window.SF_SUPABASE;


if(!supabase){

alert("Database connection failed");
return;

}



const user = await supabase.auth.getUser();



const form = {


user_id:user.data.user?.id || null,


full_name:
fullName.value,


email:
email.value,


phone:
phone.value,


date_of_birth:
dob.value,


country:
country.value,


address:
address.value,


application_type:
applicationType.value,


purpose:
purpose.value,


description:
description.value,


notes:
notes.value,


payment_method:
paymentMethod.value,


transaction_id:
transactionId.value,


payment_number:
paymentNumber.value,


amount:
Number(amount.value || 0),


status:"pending"

};



const {error}=await supabase
.from("applications")
.insert(form);



if(error){

console.error(error);

message.innerHTML=
"Application failed";

return;

}



message.innerHTML=
"Application submitted successfully";


document
.getElementById("applicationForm")
.reset();


});