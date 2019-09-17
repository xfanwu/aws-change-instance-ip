const exec = require('child_process').exec

const INSTANCE_ID = 'i-05338ffd430e8e0e4'

function execute(command, callback) {
    exec(command, (error, stdout, stderr) => {
        if (error) {
            throw (error)
        }
        if (stderr) {
            throw new Error(stderr)
        }
        callback(stdout)
    })
}

const changeIP = function () {
    execute('aws ec2 allocate-address', res => {
        const result = JSON.parse(res)
        const newIP = result.PublicIp
        execute(`echo ${newIP} >> used-ip.txt`, () => {})
        console.log(`New IP allocated: ${newIP}`)

        execute(`aws ec2 associate-address --instance-id ${INSTANCE_ID} --public-ip ${newIP}`, res => {
            console.log(`Associated to instance ${INSTANCE_ID}`)
            execute('aws ec2 describe-addresses', res => {
                const result = JSON.parse(res)
                const oldIP = result.Addresses.filter(item => { return item.AssociationId === undefined })
                console.log(`Start to release old IPs`)
                oldIP.forEach(item => {
                    const allocationId = item.AllocationId
                    execute(`aws ec2 release-address --allocation-id ${allocationId}`, res => {
                        console.log(`${allocationId} has been released`)
                        if (process.platform === "darwin") {
                            execute(`echo "${newIP}" | pbcopy`, res => {
                                console.log(`Copied ${newIP} to pastboard`)
                            })
                        }
                    })
                })
            })
        })
    })
}


changeIP()
