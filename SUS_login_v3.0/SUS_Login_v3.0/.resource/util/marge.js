const fs = require('fs');

function writeJSON(dir, data) {
	fs.writeFileSync(dir, JSON.stringify(data));
}
module.exports = async function marge(){
	const path_schedule = "resource/data/schedule.json";
	const path_subject = "resource/data/subject.json";
	const path_marge = "resource/data/marge.json";

	const data_schedule = JSON.parse(fs.readFileSync("resource/data/schedule.json","utf-8"));
	const data_subject = JSON.parse(fs.readFileSync("resource/data/subject.json","utf-8"));
	const data_marge = {
		"bf":[],
		"af":[]
	};
	const index_schedule = 0;
	const index_subject = 0;
	const index_marge = 0;

	const count_schedule = 0;
	const count_subject = 0;
	const count_marge = 0;
	// console.log(data_subject.length);
	for (let i = 0; i < data_subject.length; i++) {
		const code = data_subject[i].code[0];
		const id = data_subject[i].id;
		// console.log(code);
		const matchingData_bf = data_schedule.bf.find(item => item.class_code === code);
		const matchingData_af = data_schedule.af.find(item => item.class_code === code);
		if (matchingData_bf) {
			// console.log(matchingData_bf);
			const title = matchingData_bf.class_name;
			data_marge.bf.push({ "id":id,"code":code, "title":title });
		}
		if (matchingData_af) {
			const title = matchingData_af.class_name;
			data_marge.af.push({ "id": id,"code":code,"title": title });
		}
	}
	writeJSON(path_marge, data_marge);
}